import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { defaultLimiter } from "@/middleware/rateLimiter.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import {
  getProjectsService,
  getProjectByIdService,
  createProjectService,
  updateProjectService,
  deleteProjectService,
} from "@/services/projects.service";

const projectsRouter = Router();

projectsRouter.use(authMiddleware);
projectsRouter.use(defaultLimiter);

// GET projects or single project (Viewer and above)
projectsRouter.get("/", getProjectsService);
projectsRouter.get("/:id", getProjectByIdService);

// POST /api/projects/:id — update (Member and above)
projectsRouter.post(
  "/",
  requireRole("Member", "TenantAdmin", "SuperAdmin"),
  createProjectService,
);

// PUT /api/projects/:id — update (Member and above)
projectsRouter.put(
  "/",
  requireRole("Member", "TenantAdmin", "SuperAdmin"),
  updateProjectService,
);

// DELETE /api/projects/:id — update (Member and above)
projectsRouter.delete(
  "/:id",
  requireRole("Member", "TenantAdmin", "SuperAdmin"),
  deleteProjectService,
);

export default projectsRouter;
