'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const SCENARIOS = [
  {
    key: 'scenario1',
    title: 'Overheating HVAC Unit',
    desc: 'Commercial HVAC showing overheating and reduced airflow.',
    img: '/demo_media/frames/scenario1.jpg',
    tone: 'warning',
  },
  {
    key: 'scenario2',
    title: 'Generator Malfunction',
    desc: 'Backup generator not starting; likely electrical/control issue.',
    img: '/demo_media/frames/scenario2.jpg',
    tone: 'neutral',
  },
  {
    key: 'scenario3',
    title: 'Water Pump Failure (Hazard)',
    desc: 'Water damage near electrical panel; exposed wiring hazard.',
    img: '/demo_media/frames/scenario3.jpg',
    tone: 'danger',
  },
];

type Scenario = (typeof SCENARIOS)[number];

const toneBadge: Record<string, string> = {
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  neutral: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export default function ScenarioGallery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const runScenario = (scenario: Scenario) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('mode', 'demo');
    params.set('scenario', scenario.key);
    router.push(`/live?${params.toString()}`);
  };

  const openModal = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setIsOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Scenario Gallery</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Preview each scenario before running the live demo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SCENARIOS.map((scenario) => (
          <div
            key={scenario.key}
            className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={scenario.img}
                alt={scenario.title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 100vw"
                priority={scenario.key === 'scenario1'}
              />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {scenario.title}
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {scenario.desc}
                </p>
              </div>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                  toneBadge[scenario.tone]
                }`}
              >
                {scenario.tone}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => runScenario(scenario)}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Run scenario
              </button>
              <button
                type="button"
                onClick={() => openModal(scenario)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && activeScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {activeScenario.title}
              </h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-semibold text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200"
              >
                Close
              </button>
            </div>
            <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-xl">
              <Image
                src={activeScenario.img}
                alt={activeScenario.title}
                fill
                className="object-contain"
                sizes="(min-width: 768px) 80vw, 100vw"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
