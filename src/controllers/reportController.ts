import { Request, Response } from "express";
import { Report } from "../models/Report";

// Obtiene todos los reportes de damnificados
export const getReports = async (req: Request, res: Response) => {
  try {
    const dbReports = await Report.find().sort({ date: -1 });
    
    // Map db structure back to frontend expectations
    const mappedReports = dbReports.map((r) => ({
      id: r._id.toString(),
      earthquakeId: r.earthquakeId,
      reporterName: r.reporterName,
      phone: r.phone,
      locationName: r.locationName,
      lat: r.location.coordinates[1], // Latitude
      lng: r.location.coordinates[0], // Longitude
      affectedPeople: r.affectedPeople,
      affectedHouses: r.affectedHouses || 0,
      needs: r.needs,
      description: r.description,
      status: r.status,
      date: r.date.toISOString()
    }));

    res.json(mappedReports);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Crea un nuevo reporte de damnificados
export const createReport = async (req: Request, res: Response) => {
  const {
    earthquakeId,
    reporterName,
    phone,
    locationName,
    lat,
    lng,
    affectedPeople,
    affectedHouses,
    needs,
    description,
    status
  } = req.body;

  try {
    const newReport = new Report({
      earthquakeId,
      reporterName,
      phone,
      locationName,
      location: {
        type: "Point",
        coordinates: [lng, lat] // MongoDB requires [longitude, latitude]
      },
      affectedPeople: affectedPeople || 0,
      affectedHouses: affectedHouses || 0,
      needs: needs || [],
      description,
      status: status || "pending"
    });

    const saved = await newReport.save();

    // Retorna el reporte con el formato adecuado
    res.status(201).json({
      id: saved._id.toString(),
      earthquakeId: saved.earthquakeId,
      reporterName: saved.reporterName,
      phone: saved.phone,
      locationName: saved.locationName,
      lat: saved.location.coordinates[1],
      lng: saved.location.coordinates[0],
      affectedPeople: saved.affectedPeople,
      affectedHouses: saved.affectedHouses,
      needs: saved.needs,
      description: saved.description,
      status: saved.status,
      date: saved.date.toISOString()
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Actualiza el estado del reporte
export const updateReportStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    res.json({
      id: updated._id.toString(),
      earthquakeId: updated.earthquakeId,
      reporterName: updated.reporterName,
      phone: updated.phone,
      locationName: updated.locationName,
      lat: updated.location.coordinates[1],
      lng: updated.location.coordinates[0],
      affectedPeople: updated.affectedPeople,
      affectedHouses: updated.affectedHouses,
      needs: updated.needs,
      description: updated.description,
      status: updated.status,
      date: updated.date.toISOString()
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
