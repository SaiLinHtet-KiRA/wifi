"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UtilSchema = new mongoose_1.default.Schema({
    _id: String,
    value: { type: String },
}, {
    timestamps: false,
    versionKey: false,
});
const UtilModel = mongoose_1.default.connection
    .useDb("Util")
    .model("Util", UtilSchema);
exports.default = UtilModel;
