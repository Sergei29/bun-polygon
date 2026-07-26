import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import request from "supertest";
import { inArray, like } from "drizzle-orm";
import { app } from "@/app";
import { db, client } from "@/db";
import { withTenantContext } from "@/db/tenantContext";
import { tenants, users, projects } from "@/db/schema";
import { generateToken } from "@/utils/token";
import { redisClient } from "@/db/redis";

// Test fixture: two isolated tenants, one project in Tenant B
async function seedTestData() {
  // Clean up from any previous run to avoid unique-constraint failures
  await db.delete(projects).where(like(projects.name, "TEST-%"));
  await db
    .delete(tenants)
    .where(inArray(tenants.name, ["Tenant A", "Tenant B"]));

  const [tenantA] = await db
    .insert(tenants)
    .values({ name: "Tenant A", plan: "pro" })
    .returning();

  const [tenantB] = await db
    .insert(tenants)
    .values({ name: "Tenant B", plan: "pro" })
    .returning();

  const [userA] = await db
    .insert(users)
    .values({ tenantId: tenantA!.id, email: "usera@a.com", role: "Member" })
    .returning();

  // userB owns the project in Tenant B — satisfies the created_by FK constraint
  const [userB] = await db
    .insert(users)
    .values({ tenantId: tenantB!.id, email: "userb@b.com", role: "Member" })
    .returning();

  // projects has an RLS write policy keyed on app.tenant_id — inserting requires
  // going through withTenantContext, same as the real repository layer does.
  const [projectB] = await withTenantContext(tenantB!.id, (tx) =>
    tx
      .insert(projects)
      .values({
        tenantId: tenantB!.id,
        name: "TEST-Secret Project",
        createdBy: userB!.id,
      })
      .returning(),
  );

  return {
    tenantA: tenantA!.id,
    tenantB: tenantB!.id,
    userA: userA!.id,
    projectB: projectB!.id,
  };
}

describe("Tenant Isolation", () => {
  let data: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    data = await seedTestData();
  });

  afterAll(async () => {
    await db.delete(projects).where(like(projects.name, "TEST-%"));
    await db
      .delete(tenants)
      .where(inArray(tenants.name, ["Tenant A", "Tenant B"]));
    await client.end();
    await redisClient.quit(); // close Redis connection so bun test exits cleanly
  });

  test("Tenant A user cannot read Tenant B project", async () => {
    const token = generateToken({
      userId: data.userA,
      tenantId: data.tenantA, // ← Tenant A token
      email: "usera@a.com",
      role: "Member",
    });

    const res = await request(app)
      .get(`/projects/${data.projectB}`) // ← Tenant B's project ID
      .set("Authorization", `Bearer ${token}`);

    // Must be 404, not 200 or 403
    expect(res.status).toBe(404);
  });

  test("Tenant A user cannot list Tenant B projects", async () => {
    const token = generateToken({
      userId: data.userA,
      tenantId: data.tenantA,
      email: "usera@a.com",
      role: "TenantAdmin",
    });

    const res = await request(app)
      .get("/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Response must contain zero Tenant B projects
    const names = res.body.map((p: { name: string }) => p.name);
    expect(names).not.toContain("TEST-Secret Project");
  });

  test("Viewer cannot delete a project", async () => {
    const token = generateToken({
      userId: data.userA,
      tenantId: data.tenantA,
      email: "usera@a.com",
      role: "Viewer", // ← Viewer role
    });

    const res = await request(app)
      .delete(`/projects/${data.projectB}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
