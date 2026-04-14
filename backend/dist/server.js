"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { connectDB } from "./config/DB/mongoose";
const index_1 = require("./server/index");
async function start() {
    // await connectDB();
    index_1.express.startServer();
}
start();
