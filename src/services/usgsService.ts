import { Earthquake } from "../models/Earthquake";

interface USGSFeature {
  id: string;
  properties: {
    title: string;
    time: number; // epoch timestamp in ms
    mag: number;
    place: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

export const syncUSGSEarthquakes = async (): Promise<{ total: number; added: number }> => {
  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from USGS: ${response.statusText}`);
    }

    const data = await response.json();
    const features: USGSFeature[] = data.features || [];

    // Bounding box for Colombia:
    // Longitude: between -82.0 and -66.0
    // Latitude: between -4.5 and 13.5
    const minLng = -82.0;
    const maxLng = -66.0;
    const minLat = -4.5;
    const maxLat = 13.5;

    let addedCount = 0;

    for (const feature of features) {
      const [lng, lat, depth] = feature.geometry.coordinates;

      // Filter by bounding box
      if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
        const title = feature.properties.title || `Sismo en Colombia M ${feature.properties.mag}`;
        const date = new Date(feature.properties.time);
        
        // Check if this earthquake is already registered in MongoDB
        const existing = await Earthquake.findOne({ title, date });
        if (existing) continue;

        const magnitude = feature.properties.mag || 3.0;
        const region = feature.properties.place || "Colombia";

        // Calculate a realistic initial impact for large earthquakes so charts display data immediately
        let affectedCount = 0;
        let victimsStatus = { critical: 0, minor: 0, safe: 0 };
        let needs: { type: string; requested: number; delivered: number; unit: string }[] = [];

        if (magnitude >= 5.5) {
          // Dynamic calculation based on magnitude scale
          affectedCount = Math.round((magnitude - 5.0) * 1200);
          const critical = Math.round(affectedCount * 0.05);
          const minor = Math.round(affectedCount * 0.25);
          const safe = affectedCount - (critical + minor);
          
          victimsStatus = { critical, minor, safe };
          needs = [
            { type: "Carpas/Refugio", requested: Math.round(affectedCount * 0.2), delivered: 0, unit: "unidades" },
            { type: "Agua Potable", requested: affectedCount * 5, delivered: 0, unit: "litros" },
            { type: "Alimentos", requested: affectedCount * 2, delivered: 0, unit: "raciones" },
            { type: "Kits de Aseo", requested: Math.round(affectedCount * 0.25), delivered: 0, unit: "kits" }
          ];
        }

        const newEarthquake = new Earthquake({
          title,
          date,
          magnitude,
          depth: Math.round(depth),
          location: {
            type: "Point",
            coordinates: [lng, lat]
          },
          region,
          affectedCount,
          victimsStatus,
          needs
        });

        await newEarthquake.save();
        addedCount++;
      }
    }

    return { total: features.length, added: addedCount };
  } catch (error) {
    console.error("❌ Error running USGS Sync Service:", error);
    throw error;
  }
};
