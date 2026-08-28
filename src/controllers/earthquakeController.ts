import { Request, Response } from "express";
import { Earthquake } from "../models/Earthquake";
import { Report } from "../models/Report";
import { syncUSGSEarthquakes } from "../services/usgsService";

// Obtiene todos los sismos con la agregación dinámica de reportes
export const getEarthquakes = async (req: Request, res: Response) => {
  try {
    const dbEvents = await Earthquake.find().sort({ date: -1 });

    const mappedEvents = await Promise.all(
      dbEvents.map(async (e) => {
        // Consulta todos los reportes vinculados a este sismo específico
        const associatedReports = await Report.find({ earthquakeId: e._id.toString() });

        // Suma personas y viviendas de los reportes en el terreno
        const reportsPeopleSum = associatedReports.reduce((sum, r) => sum + r.affectedPeople, 0);
        const reportsHousesSum = associatedReports.reduce((sum, r) => sum + (r.affectedHouses || 0), 0);

        // Si hay reportes en el terreno, sobrescriben dinámicamente las estimaciones iniciales
        let affectedCount = e.affectedCount || 0;
        let affectedHouses = 0;
        let victimsStatus = { ...e.victimsStatus };

        if (associatedReports.length > 0) {
          // Agrega la información de los reportes a los contadores
          affectedCount = reportsPeopleSum;
          affectedHouses = reportsHousesSum;

          // Estima la distribución crítico/leve/a salvo según la cantidad de personas afectadas en los reportes
          const critical = Math.round(reportsPeopleSum * 0.08);
          const minor = Math.round(reportsPeopleSum * 0.32);
          const safe = reportsPeopleSum - (critical + minor);
          victimsStatus = { critical, minor, safe };
        } else if (e.magnitude >= 5.5 && affectedCount > 0) {
          // Si es un sismo mayor sin reportes aún, estima viviendas afectadas basadas en la magnitud
          affectedHouses = Math.round(affectedCount / 4.5);
        }

        return {
          id: e._id.toString(),
          title: e.title,
          date: e.date.toISOString(),
          magnitude: e.magnitude,
          depth: e.depth,
          lat: e.location.coordinates[1], // Latitud
          lng: e.location.coordinates[0], // Longitud
          region: e.region,
          affectedCount,
          affectedHouses, // Campo dinámico añadido
          victimsStatus,
          needs: e.needs
        };
      })
    );

    res.json(mappedEvents);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Sincroniza sismos desde el feed en tiempo real de la USGS
export const syncEarthquakes = async (req: Request, res: Response) => {
  try {
    const stats = await syncUSGSEarthquakes();
    res.json({
      message: "Sincronización con la USGS completada con éxito.",
      totalFetched: stats.total,
      newEarthquakesAdded: stats.added
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
