import { Router } from "express";
import locationRouter from "../location/route";

const router = Router();

router.get("/", (req, res) => {
  res.json("all good").status(200);
});

router.use("/location", locationRouter);

export default router;
