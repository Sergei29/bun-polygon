import { eq, and } from "drizzle-orm";
import { withTenantContext } from "@/db/tenantContext";
import { projects } from "@/db/schema";

export const listProjects = async ({ tenantId }: { tenantId: string }) =>
  withTenantContext(tenantId, (tx) =>
    tx.select().from(projects).where(eq(projects.tenantId, tenantId)),
  );

export const getProject = async ({
  projectId,
  tenantId,
}: {
  projectId: string;
  tenantId: string;
}) =>
  withTenantContext(tenantId, async (tx) => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)));

    return project || null;
  });

export const createProject = async (input: {
  tenantId: string;
  name: string;
  description?: string;
  createdBy: string;
}) =>
  withTenantContext(input.tenantId, async (tx) => {
    const result = await tx.insert(projects).values(input).returning();

    return result[0] || null;
  });

export const updateProject = async ({
  projectId,
  tenantId,
  input,
}: {
  projectId: string;
  tenantId: string;
  input: { name: string; description?: string | null };
}) =>
  withTenantContext(tenantId, async (tx) => {
    const result = await tx
      .update(projects)
      .set(input)
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
      .returning();

    return result[0] || null;
  });

export const deleteProject = async ({
  projectId,
  tenantId,
}: {
  projectId: string;
  tenantId: string;
}) =>
  withTenantContext(tenantId, async (tx) => {
    const result = await tx
      .delete(projects)
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
      .returning();

    return result[0]?.id || null;
  });
