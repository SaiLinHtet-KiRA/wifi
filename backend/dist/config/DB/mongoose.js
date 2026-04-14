"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const config_1 = require("../config");
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDB() {
    try {
        await mongoose_1.default.connect(config_1.MONGODB_URL);
        console.log("MongoDB is connected");
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
}
