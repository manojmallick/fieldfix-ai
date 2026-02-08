import { z } from 'zod';

export const SafetyCheckSchema = z.object({
  pass: z.boolean(),
  ppeRequired: z.array(z.string()),
  hazards: z.array(z.string()),
  requiredPresteps: z.array(z.string()),
});

export type SafetyCheck = z.infer<typeof SafetyCheckSchema>;
