'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface RunQAGateButtonProps {
  sessionId: string;
}

export default function RunQAGateButton({ sessionId }: RunQAGateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.error ?? 'Failed to run QA');
          return;
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run QA');
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button className="btn-secondary" onClick={handleRun} disabled={isPending}>
        {isPending ? 'Running QA...' : 'Run QA Gate'}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
}
