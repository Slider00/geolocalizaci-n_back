import { Schema, model } from "mongoose";

export interface IEarthquake {
  title: string;
  date: Date;
  magnitude: number;
  depth: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitud, latitud]
  };
  region: string;
  affectedCount: number;
  victimsStatus: {
    critical: number;
    minor: number;
    safe: number;
  };
  needs: {
    type: string;
    requested: number;
    delivered: number;
    unit: string;
  }[];
}

const EarthquakeSchema = new Schema<IEarthquake>({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  magnitude: { type: Number, required: true },
  depth: { type: Number, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true
    }
  },
  region: { type: String, required: true },
  affectedCount: { type: Number, default: 0 },
  victimsStatus: {
    critical: { type: Number, default: 0 },
    minor: { type: Number, default: 0 },
    safe: { type: Number, default: 0 }
  },
  needs: [
    {
      type: { type: String, required: true },
      requested: { type: Number, required: true },
      delivered: { type: Number, default: 0 },
      unit: { type: String, required: true }
    }
  ]
});

// Crea un índice espacial 2dsphere para consultas geoespaciales
EarthquakeSchema.index({ location: "2dsphere" });

export const Earthquake = model<IEarthquake>("Earthquake", EarthquakeSchema);
