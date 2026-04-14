"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = __importDefault(require("./service"));
const errors_1 = require("../util/error/errors");
class LocationController {
    async reverseGeocode(req, res, next) {
        try {
            const lat = parseFloat(req.query.lat);
            const lng = parseFloat(req.query.lng);
            if (isNaN(lat) || isNaN(lng)) {
                throw new errors_1.ValidationError("lat and lng query params are required and must be numbers");
            }
            const result = await service_1.default.coordinatesToAddress(lat, lng);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new LocationController();
