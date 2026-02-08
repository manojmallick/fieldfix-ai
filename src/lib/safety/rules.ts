import { PlanStep } from '../schemas/plan.schema';

export interface SafetyRulesInput {
  riskFlags: string[];
  planSteps: PlanStep[];
}

export interface SafetyRulesOutput {
  pass: boolean;
  ppeRequired: string[];
  hazards: string[];
  requiredPresteps: string[];
}

export function runSafetyRules(input: SafetyRulesInput): SafetyRulesOutput {
  const { riskFlags, planSteps } = input;
  const ppe: Set<string> = new Set(['safety glasses', 'work gloves']);
  const hazards: Set<string> = new Set();
  const presteps: Set<string> = new Set();
  let pass = true;
  
  // Check risk flags
  for (const risk of riskFlags) {
    const lowerRisk = risk.toLowerCase();
    
    if (lowerRisk.includes('water') && lowerRisk.includes('power')) {
      hazards.add('electrocution');
      presteps.add('Isolate power & keep area dry');
      ppe.add('insulated gloves');
    }
    
    if (lowerRisk.includes('exposed') && lowerRisk.includes('wire')) {
      hazards.add('electrical shock');
      presteps.add('Lockout/Tagout');
      ppe.add('insulated gloves');
    }
    
    if (lowerRisk.includes('heavy')) {
      hazards.add('crushing injury');
      presteps.add('Use proper lifting equipment');
      ppe.add('steel-toe boots');
    }
    
    if (lowerRisk.includes('chemical')) {
      hazards.add('chemical exposure');
      presteps.add('Review chemical SDS');
      ppe.add('chemical-resistant gloves');
      ppe.add('safety goggles');
    }
  }
  
  // Check plan steps for electrical work keywords
  const planText = planSteps
    .map(step => step.action.toLowerCase())
    .join(' ');
  
  if (
    planText.includes('open panel') ||
    planText.includes('wiring') ||
    planText.includes('multimeter') ||
    planText.includes('power module') ||
    planText.includes('electrical')
  ) {
    presteps.add('Lockout/Tagout');
    ppe.add('insulated gloves');
    hazards.add('electrical hazard');
  }

  const hasFireRisk = riskFlags.some(flag => {
    const lower = flag.toLowerCase();
    return lower.includes('fire') || lower.includes('smoke') || lower.includes('flame');
  });
  const planMentionsFire = planText.includes('fire') || planText.includes('smoke') || planText.includes('flame');

  if (hasFireRisk || planMentionsFire) {
    pass = false;
    hazards.add('fire hazard');
    presteps.add('STOP WORK: call emergency services and follow site fire protocol');
  }
  
  if (planText.includes('height') || planText.includes('ladder') || planText.includes('roof')) {
    hazards.add('fall hazard');
    presteps.add('Secure ladder and use fall protection');
    ppe.add('harness');
  }
  
  // Safety check always passes but may require presteps
  const normalize = (items: Set<string>) =>
    Array.from(items)
      .map(item => item.trim())
      .filter(item => item.length > 0);

  return {
    pass,
    ppeRequired: normalize(ppe),
    hazards: normalize(hazards),
    requiredPresteps: normalize(presteps),
  };
}
