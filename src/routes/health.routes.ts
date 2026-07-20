import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", (_, res) => {
  return res.json({
    status: "ok",
  });
});

export default healthRouter;
