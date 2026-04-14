import { Router } from "express";
import LocationController from "./controller";

const locationRouter = Router();

locationRouter.get("", (req, res, next) =>
  LocationController.reverseGeocode(req, res, next),
);

export default locationRouter;
