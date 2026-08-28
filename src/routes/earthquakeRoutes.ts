import { Router } from "express";
import { getEarthquakes, syncEarthquakes } from "../controllers/earthquakeController";
import { seedDatabase } from "../controllers/seedController";

const router = Router();

router.get("/", getEarthquakes);
router.post("/seed", seedDatabase);
router.post("/sync", syncEarthquakes);

export default router;
