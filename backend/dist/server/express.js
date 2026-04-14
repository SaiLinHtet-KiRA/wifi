"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = __importDefault(require("../router"));
const handler_1 = require("../util/error/handler");
const cors_1 = __importDefault(require("cors"));
class ExpressServer {
    constructor() {
        this.app = (0, express_1.default)();
    }
    startServer() {
        this.app.set("trust proxy", 1);
        this.app.use((0, cors_1.default)({
            origin: ["http://localhost:3000"],
            credentials: true,
        }));
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
        this.app.use(express_1.default.json());
        this.app.use(router_1.default);
        this.app.use(handler_1.HandleErrorWithLogger);
        this.app.listen(4000, () => console.log("Express server is started in port ", 4000));
    }
}
exports.default = ExpressServer;
