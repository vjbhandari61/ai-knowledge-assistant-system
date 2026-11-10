import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import dbRoutes from "./routes/db.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import ragRoutes from "./routes/rag.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/db", dbRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/documents", documentRoutes);
app.use("/documents", ragRoutes);

export default app;