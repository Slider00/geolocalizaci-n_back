import { Request, Response } from "express";
import { Earthquake } from "../models/Earthquake";
import { Report } from "../models/Report";
import { syncUSGSEarthquakes } from "../services/usgsService";

// Fetch all earthquakes with dynamic reports aggregation
export const getEarthquakes = async (req: Request, res: Response) => {
  try {
    const dbEvents = await Earthquake.find().sort({ date: -1 });

    const mappedEvents = await Promise.all(
      dbEvents.map(async (e) => {
        // Query all reports linked to this specific earthquake
        const associatedReports = await Report.find({ earthquakeId: e._id.toString() });

        // Sum people and houses from field reports
        const reportsPeopleSum = associatedReports.reduce((sum, r) => sum + r.affectedPeople, 0);
        const reportsHousesSum = associatedReports.reduce((sum, r) => sum + (r.affectedHouses || 0), 0);

        // If there are field reports, they override the baseline estimations dynamically
        let affectedCount = e.affectedCount || 0;
        let affectedHouses = 0;
        let victimsStatus = { ...e.victimsStatus };

        if (associatedReports.length > 0) {
          // Add reports data to the baseline estimations
          affectedCount = reportsPeopleSum;
          affectedHouses = reportsHousesSum;

          // Estimate the critical/minor/safe split based on active reports count
          const critical = Math.round(reportsPeopleSum * 0.08);
          const minor = Math.round(reportsPeopleSum * 0.32);
          const safe = reportsPeopleSum - (critical + minor);
          victimsStatus = { critical, minor, safe };
        } else if (e.magnitude >= 5.5 && affectedCount > 0) {
          // If it's a major sismo with no reports yet, estimate baseline houses affected
          affectedHouses = Math.round(affectedCount / 4.5);
        }

        return {
          id: e._id.toString(),
          title: e.title,
          date: e.date.toISOString(),
          magnitude: e.magnitude,
          depth: e.depth,
          lat: e.location.coordinates[1], // Latitude
          lng: e.location.coordinates[0], // Longitude
          region: e.region,
          affectedCount,
          affectedHouses, // Added dynamic property
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

// Sync earthquakes from USGS real-time feed
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
