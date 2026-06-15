import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import policiesRouter from "./routes/policies";
import ussdRouter from "./routes/ussd";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "coverchain-backend", timestamp: new Date().toISOString() });
});

app.use("/api/v1/policies", policiesRouter);
app.use("/ussd", ussdRouter);

app.listen(PORT, () => {
  console.log(`CoverChain backend running on port ${PORT}`);
});

export default app;
