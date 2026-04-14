"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../util/error/errors");
class LocationService {
    constructor() {
        this.instance = axios_1.default.create({
            baseURL: "https://nominatim.openstreetmap.org",
            headers: {
                "User-Agent": "wifi-detection/1.0 (sailinhtet.d@gmail.com)",
            },
            timeout: 5000,
        });
    }
    async coordinatesToAddress(lat, lng) {
        try {
            const response = await this.instance.get("/reverse", {
                params: {
                    lat,
                    lon: lng,
                    format: "json",
                    "accept-language": "en",
                },
            });
            const data = response.data;
            // Nominatim returns error inside data sometimes
            if (!data || data.error) {
                throw new errors_1.ValidationError("No address found for the given coordinates");
            }
            const addr = data.address;
            const streetNumber = addr?.house_number ?? "";
            const road = addr?.road ?? "";
            const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? "";
            const country = addr?.country ?? "";
            const address = [streetNumber, road].filter(Boolean).join(" ");
            return {
                address,
                city,
                country,
                formattedAddress: data.display_name,
            };
        }
        catch (error) {
            console.error("Nominatim error:", error.message);
            throw new errors_1.APIError("Failed to reach Nominatim API");
        }
    }
}
exports.default = new LocationService();
