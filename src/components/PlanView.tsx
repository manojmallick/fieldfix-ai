'use client';

import { useState } from 'react';
import { PlanStep } from '@/lib/schemas/plan.schema';
import CitationDrawer from './CitationDrawer';

interface KBSnapshot {
  id: string;
  kbId: string;
  title: string;
  snippet: string;
  source: string;
  raw: string;
}

interface PlanViewProps {
  steps: PlanStep[];
  kbSnapshots: KBSnapshot[];
}

export default function PlanView({ steps, kbSnapshots }: PlanViewProps) {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const openCitation = (kbId: string) => {
    setSelectedKbId(kbId);
    setDrawerOpen(true);
  };
  
  return (
    <>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.stepNumber} className="card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{step.action}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>⏱️ {step.duration} minutes</span>
                </div>
                <div>
                  <span className="text-sm font-semibold">Citations:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {step.citations.map((citation, i) => (
                      <button
                        key={i}
                        onClick={() => openCitation(citation)}
                        className="badge badge-info cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        {citation}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <CitationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        kbId={selectedKbId}
        kbSnapshots={kbSnapshots}
      />
    </>
  );
}
