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
        let needs = [...e.needs];

        if (associatedReports.length > 0) {
          // Agrega la información de los reportes a los contadores
          affectedCount = reportsPeopleSum;
          affectedHouses = reportsHousesSum;

          // Estima la distribución crítico/leve/a salvo según la cantidad de personas afectadas en los reportes
          const critical = Math.round(reportsPeopleSum * 0.08);
          const minor = Math.round(reportsPeopleSum * 0.32);
          const safe = reportsPeopleSum - (critical + minor);
          victimsStatus = { critical, minor, safe };

          // Consolidación dinámica de suministros basados en los reportes de campo
          const dynamicNeedsMap: Record<string, { requested: number; delivered: number; unit: string }> = {
            "Carpas/Refugio": { requested: 0, delivered: 0, unit: "unidades" },
            "Agua Potable": { requested: 0, delivered: 0, unit: "litros" },
            "Alimentos": { requested: 0, delivered: 0, unit: "raciones" },
            "Kits de Aseo": { requested: 0, delivered: 0, unit: "kits" },
            "Atención Médica": { requested: 0, delivered: 0, unit: "consultas" }
          };

          // Inicializa requerimientos y entregas con el valor base cargado si coincide
          e.needs.forEach(n => {
            if (dynamicNeedsMap[n.type]) {
              dynamicNeedsMap[n.type].requested = n.requested || 0;
              dynamicNeedsMap[n.type].delivered = n.delivered || 0;
            }
          });

          // Acumula la cantidad solicitada según la cantidad de afectados de los reportes
          associatedReports.forEach(r => {
            r.needs.forEach((needType: string) => {
              if (dynamicNeedsMap[needType]) {
                let qty = 0;
                if (needType === "Agua Potable") qty = r.affectedPeople * 5; // 5 L por persona
                else if (needType === "Alimentos") qty = r.affectedPeople * 2; // 2 raciones por persona
                else if (needType === "Carpas/Refugio") qty = Math.ceil(r.affectedPeople / 4); // 1 carpa por cada 4 personas
                else if (needType === "Kits de Aseo") qty = Math.ceil(r.affectedPeople / 4); // 1 kit por cada 4 personas
                else if (needType === "Atención Médica") qty = Math.ceil(r.affectedPeople / 8); // 1 consulta por cada 8 personas

                dynamicNeedsMap[needType].requested += qty;

                // Si el reporte ya fue atendido, se suma también a lo entregado
                if (r.status === "resolved") {
                  dynamicNeedsMap[needType].delivered += qty;
                }
              }
            });
          });

          // Convierte el consolidado a la estructura final de suministros (muestra siempre las 5 categorías)
          needs = Object.entries(dynamicNeedsMap)
            .map(([type, val]) => ({
              type,
              requested: val.requested,
              delivered: Math.min(val.delivered, val.requested),
              unit: val.unit
            }));
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
          needs
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
