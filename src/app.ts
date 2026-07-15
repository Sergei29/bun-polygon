import express from "express";
import rootRouter from "@/routes";

const app = express();

app.use([express.json(), express.urlencoded({ extended: true })]);

app.use(rootRouter);

export { app };
