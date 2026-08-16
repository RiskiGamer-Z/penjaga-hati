import { z } from 'zod';

export const BookingSchema = z.object({
  mitraId: z.string().uuid("ID Mitra tidak valid"),
  hospitalId: z.string().uuid("ID Rumah Sakit tidak valid"),
  packageId: z.string().uuid("ID Paket tidak valid"),
  patientName: z.string().min(2, "Nama pasien minimal 2 karakter"),
  patientAge: z.coerce.number().min(0, "Umur tidak valid").max(150, "Umur tidak valid"),
  roomNumber: z.string().optional(),
  diagnosis: z.string().min(3, "Diagnosa/keluhan harus diisi dengan jelas"),
  specialNotes: z.string().optional(),
  durationHours: z.coerce.number().min(1, "Durasi minimal 1 jam"),
  startDate: z.string().min(1, "Tanggal mulai harus diisi"),
  startTime: z.string().min(1, "Waktu mulai harus diisi"),
});

export type BookingInput = z.infer<typeof BookingSchema>;
