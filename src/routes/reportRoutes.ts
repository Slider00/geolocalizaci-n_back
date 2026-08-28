import { Router } from "express";
import { getReports, createReport, updateReportStatus } from "../controllers/reportController";

const router = Router();

router.get("/", getReports);
router.post("/", createReport);
router.patch("/:id/status", updateReportStatus);

export default router;
