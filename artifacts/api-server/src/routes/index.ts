import { Router } from "express";
import healthRouter from "./health";
// import other routes here...

const router = Router();

router.use("/health", healthRouter);
// router.use("/auth", authRouter); 

export default router;
