import { z } from 'zod';

export const QASchema = z.object({
  pass: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  score: z.number().min(0).max(100),
});

export type QA = z.infer<typeof QASchema>;
