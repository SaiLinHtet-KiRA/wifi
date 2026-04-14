import { Request, Response, NextFunction } from "express";
import LocationService from "./service";
import { ValidationError } from "../util/error/errors";

class LocationController {
  async reverseGeocode(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        throw new ValidationError("lat and lng query params are required and must be numbers");
      }

      const result = await LocationService.coordinatesToAddress(lat, lng);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new LocationController();
