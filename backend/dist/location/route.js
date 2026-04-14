"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = __importDefault(require("./controller"));
const locationRouter = (0, express_1.Router)();
locationRouter.get("", (req, res, next) => controller_1.default.reverseGeocode(req, res, next));
exports.default = locationRouter;
