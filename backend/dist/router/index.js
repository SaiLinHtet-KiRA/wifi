"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const route_1 = __importDefault(require("../location/route"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json("all good").status(200);
});
router.use("/location", route_1.default);
exports.default = router;
