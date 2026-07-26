import { type RequestHandler } from "express";
import { createAuditLog } from "@/repositories/auditLogs.repository";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "@/repositories/projects.repository";

export const getProjectsService: RequestHandler = async (req, res, next) => {
  try {
    const projects = await listProjects({
      tenantId: req.user?.tenantId as string,
    });

    createAuditLog({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: "VIEW",
      resource: "projects",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdService: RequestHandler<
  Record<"id", string>
> = async (req, res, next) => {
  try {
    const project = await getProject({
      tenantId: req.user?.tenantId as string,
      projectId: req.params.id,
    });

    if (!project) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const createProjectService: RequestHandler = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const project = await createProject({
      tenantId: req.user!.tenantId,
      name,
      description,
      createdBy: req.user!.userId,
    });

    if (!project) {
      throw new Error("Failed to create new Project");
    }

    createAuditLog({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: "CREATE",
      resource: "projects",
      resourceId: project.id,
      newValues: project,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProjectService: RequestHandler<
  Record<"id", string>
> = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const tenantId = req.user!.tenantId;

    const currentProject = await getProject({
      projectId,
      tenantId,
    });
    if (!currentProject) {
      return res.status(404).json({ error: "Not found" });
    }

    const updateInput = {
      name: req.body.name || currentProject.name,
      description: req.body.description || currentProject.description,
    };

    const updated = await updateProject({
      projectId,
      tenantId,
      input: updateInput,
    });

    if (!updated) {
      throw new Error("Failed to update new Project");
    }

    createAuditLog({
      tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: "UPDATE",
      resource: "projects",
      resourceId: req.params.id,
      oldValues: currentProject,
      newValues: updated,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteProjectService: RequestHandler<
  Record<"id", string>
> = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const tenantId = req.user!.tenantId;
    const currentProject = await getProject({
      projectId,
      tenantId,
    });
    if (!currentProject) {
      return res.status(404).json({ error: "Not found" });
    }

    await deleteProject({
      projectId,
      tenantId,
    });

    return res.status(200).json({ deleted: projectId });
  } catch (error) {
    next(error);
  }
};
