import express from "express";
import rootRouter from "@/routes";
import { topLevelErrorhandler } from "@/errors/topLevel.errors";

const app = express();

app.use([express.json(), express.urlencoded({ extended: true })]);

app.use(rootRouter);

app.use(topLevelErrorhandler);

export { app };
