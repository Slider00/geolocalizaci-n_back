import { Schema, model } from "mongoose";

export interface IVictimReport {
  earthquakeId?: string;
  reporterName: string;
  phone?: string;
  locationName: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitud, latitud]
  };
  affectedPeople: number;
  affectedHouses: number;
  needs: ('Alimentos' | 'Agua Potable' | 'Carpas/Refugio' | 'Kits de Aseo' | 'Atención Médica')[];
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  date: Date;
}

const ReportSchema = new Schema<IVictimReport>({
  earthquakeId: { type: String, required: false },
  reporterName: { type: String, required: true },
  phone: { type: String, required: false },
  locationName: { type: String, required: true },
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
  affectedPeople: { type: Number, default: 0 },
  affectedHouses: { type: Number, default: 0 },
  needs: [{
    type: String,
    enum: ["Alimentos", "Agua Potable", "Carpas/Refugio", "Kits de Aseo", "Atención Médica"]
  }],
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"],
    default: "pending",
    required: true
  },
  date: { type: Date, default: Date.now }
});

// Crea un índice espacial 2dsphere para consultas de ubicación
ReportSchema.index({ location: "2dsphere" });

export const Report = model<IVictimReport>("Report", ReportSchema);
