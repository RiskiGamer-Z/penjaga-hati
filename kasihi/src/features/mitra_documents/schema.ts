import { z } from 'zod';

export const documentTypes = ['ktp', 'sertifikat', 'skck'] as const;

// We use File size limits in client side, but here we validate the types
export const UploadDocumentSchema = z.object({
  mitraId: z.string().uuid("ID Mitra tidak valid"),
  documentType: z.enum(documentTypes, {
    message: "Tipe dokumen tidak valid"
  }),
  fileUrl: z.string().url("URL file tidak valid")
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
