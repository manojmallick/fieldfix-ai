// Inline prompts for Gemini API calls (no filesystem reads on Vercel)

export const VISION_PROMPT = `You are an expert field service equipment analyzer. Analyze this equipment image and provide a detailed observation.

Return a JSON object with:
{
  "equipmentType": "string (e.g., Air Conditioner, Generator, Pump)",
  "problemSummary": "string (detailed summary of visible issues)",
  "riskFlags": ["array", "of", "risks"] (e.g., "water_near_power", "exposed_wires", "heavy_equipment"),
  "environmentalNotes": "string (optional, notes about environment/conditions)"
}

Focus on:
- Visible damage, wear, or malfunctions
- Safety hazards
- Environmental conditions that might affect repair
- Equipment age and condition indicators

Return ONLY valid JSON, no additional text.`;

export const PLAN_PROMPT = (observation: string, kbResults: string) => `You are an expert field service technician creating a repair plan.

OBSERVATION:
${observation}

KNOWLEDGE BASE RESULTS:
${kbResults}

Create a step-by-step repair plan. Each step MUST include at least one citation from the KB results above.

Return a JSON object with:
{
  "steps": [
    {
      "stepNumber": 1,
      "action": "string (detailed action)",
      "duration": number (minutes),
      "citations": ["KB1", "KB3"] (must reference KB IDs from results above)
    }
  ]
}

Requirements:
- Minimum 3 steps
- Each step must have at least 1 citation
- Duration must be realistic (5-60 minutes per step)
- Include safety checks, diagnostics, repairs, and verification

Return ONLY valid JSON, no additional text.`;

export const QA_PROMPT = (plan: string) => `You are a quality assurance expert reviewing a field service plan.

PLAN TO REVIEW:
${plan}

Assess this plan for:
- Completeness
- Safety considerations
- Logical sequence
- Time estimates
- Missing steps

Return a JSON object with:
{
  "pass": boolean,
  "issues": ["array of issues found"],
  "recommendations": ["array of improvements"],
  "score": number (0-100)
}

Return ONLY valid JSON, no additional text.`;

export const FIX_JSON_PROMPT = (invalidJson: string, originalPrompt: string) => `You previously generated invalid JSON. Fix it now.

YOUR PREVIOUS INVALID OUTPUT:
${invalidJson}

ORIGINAL PROMPT:
${originalPrompt}

Return corrected, valid JSON only. No explanations, no markdown, just the JSON object.`;
