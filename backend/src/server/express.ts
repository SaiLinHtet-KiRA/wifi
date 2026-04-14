import express, { Express } from "express";
import Routes from "../router";

import { HandleErrorWithLogger } from "../util/error/handler";
import cors from "cors";

export default class ExpressServer {
  private app: Express;
  constructor() {
    this.app = express();
  }
  startServer() {
    this.app.set("trust proxy", 1);
    this.app.use(
      cors({
        origin: ["http://localhost:3000"],
        credentials: true,
      }),
    );

    // this.app.use(
    //   cookie({
    //     name: "session",
    //     keys: ["your-secret-key"],
    //     maxAge: 24 * 60 * 60 * 1000, // 1 day
    //     secure: false,
    //     httpOnly: true,
    //     sameSite: "lax",
    //   }),
    // );

    this.app.use(express.json());
    this.app.use(Routes);

    this.app.use(HandleErrorWithLogger);
    this.app.listen(4000, () =>
      console.log("Express server is started in port ", 4000),
    );
  }
}
