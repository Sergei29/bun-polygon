import express from "express";

const app = express();

app.use([express.json(), express.urlencoded({ extended: true })]);

app.get("/health", (_, res) => {
  return res.json({
    status: "ok",
  });
});

export { app };
