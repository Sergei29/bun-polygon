import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export const listProjects = async ({ tenantId }: { tenantId: string }) => {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId));

  return rows;
};

export const getProject = async ({
  projectId,
  tenantId,
}: {
  projectId: string;
  tenantId: string;
}) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)));

  return project || null;
};

export const createProject = async (input: {
  tenantId: string;
  name: string;
  description?: string;
  createdBy: string;
}) => {
  const result = await db.insert(projects).values(input).returning();

  return result[0] || null;
};

export const updateProject = async ({
  projectId,
  tenantId,
  input,
}: {
  projectId: string;
  tenantId: string;
  input: { name: string; description?: string | null };
}) => {
  const result = await db
    .update(projects)
    .set(input)
    .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
    .returning();

  return result[0] || null;
};

export const deleteProject = async ({
  projectId,
  tenantId,
}: {
  projectId: string;
  tenantId: string;
}) => {
  const result = await db
    .delete(projects)
    .where(and(eq(projects.tenantId, tenantId), eq(projects.id, projectId)))
    .returning();

  return result[0]?.id || null;
};
