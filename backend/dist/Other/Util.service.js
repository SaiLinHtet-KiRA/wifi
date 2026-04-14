"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_repo_1 = __importDefault(require("./Util.repo"));
class ConfigService {
    async findOrCreate(id, data) {
        try {
            return await Util_repo_1.default.getById(id);
        }
        catch (error) {
            return await Util_repo_1.default.updateById(id, data);
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
    async getConfigById(id) {
        try {
            return await Util_repo_1.default.getById(id);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = new ConfigService();
