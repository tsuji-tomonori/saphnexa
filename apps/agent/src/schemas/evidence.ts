import { z } from "zod";

export const EvidenceSchema = z.object({
  evidence_id: z.string(),
  chunk_id: z.string(),
  document_id: z.string(),
  version_id: z.string().optional(),
  document_name: z.string().optional(),
  version_label: z.string().optional(),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  text: z.string().min(1)
});

export const CitationSchema = z.object({
  citation_id: z.string().optional(),
  document_id: z.string(),
  version_id: z.string().optional(),
  chunk_id: z.string().optional(),
  display: z.object({
    document_name: z.string().optional(),
    version_label: z.string().optional(),
    page: z.number().int().positive().optional(),
    section: z.string().optional()
  }).optional()
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type Citation = z.infer<typeof CitationSchema>;
