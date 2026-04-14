"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_model_1 = __importDefault(require("./Util.model"));
const errors_1 = require("../util/error/errors");
class UtilRepo {
    async create(id) {
        try {
            throw new Error("Method not implemented.");
        }
        catch (error) {
            throw error;
        }
    }
    async getById(id) {
        try {
            const config = await Util_model_1.default.findById(id);
            if (!config)
                throw new errors_1.NotFoundError(`Config id-${id} is not found`);
            return config;
        }
        catch (error) {
            throw error;
        }
    }
    async updateById(id, data) {
        try {
            return await Util_model_1.default.findByIdAndUpdate(id, data, {
                new: true,
                upsert: true,
            });
        }
        catch (error) {
            throw error;
        }
    }
    async deleteById(id) {
        try {
            throw new Error("Method not implemented.");
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = new UtilRepo();
