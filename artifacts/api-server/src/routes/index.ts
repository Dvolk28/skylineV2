import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import goalsRouter from "./goals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(goalsRouter);

export default router;
