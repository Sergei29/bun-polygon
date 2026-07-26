import { Router } from "express";

const projectsRouter = Router();

projectsRouter.get("/", (_, res) => {
  return res.json({
    status: "ok",
  });
});

export default projectsRouter;
