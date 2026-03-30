import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http"; // Changed to named import
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import type { IncomingMessage, ServerResponse } from "http"; // Added for typing

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: string | number }) { // Added types
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) { // Added types
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
