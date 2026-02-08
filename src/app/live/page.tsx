'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  name: string;
  imagePath: string;
  userDescription: string;
  kbQuery: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'scenario1',
    name: 'Overheating HVAC Unit',
    imagePath: '/demo_media/frames/scenario1.jpg',
    userDescription: 'Commercial HVAC unit showing signs of overheating and reduced airflow',
    kbQuery: 'hvac overheating airflow filter compressor',
  },
  {
    id: 'scenario2',
    name: 'Generator Malfunction',
    imagePath: '/demo_media/frames/scenario2.jpg',
    userDescription: 'Backup generator not starting, possible electrical issue',
    kbQuery: 'generator starting electrical battery fuel',
  },
  {
    id: 'scenario3',
    name: 'Water Pump Failure (Hazard)',
    imagePath: '/demo_media/frames/scenario3.jpg',
    userDescription: 'Industrial water pump near electrical panel, visible water damage and exposed wiring',
    kbQuery: 'water pump electrical hazard wiring motor',
  },
];

export default function LivePage() {
  const router = useRouter();
  // Use a client-side URLSearchParams instead of next/navigation's useSearchParams
  // to avoid the CSR bailout warning on server-render.
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window === 'undefined') return new URLSearchParams('');
    return new URLSearchParams(window.location.search);
  });
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const autoRunStarted = useRef(false);
  const selectedScenarioRef = useRef<Scenario>(SCENARIOS[0]);
    // Helper to update scenario param in URL
    const updateScenarioInUrl = (scenarioId: string, mode?: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set('scenario', scenarioId);
      if (mode) params.set('mode', mode);
      router.replace(`?${params.toString()}`);
      setSearchParams(params);
    };

  const runFullDemo = useCallback(async (scenarioOverride?: Scenario) => {
    const scenarioParam = searchParams.get('scenario');
    const scenarioFromParam = scenarioParam
      ? SCENARIOS.find((item) => item.id === scenarioParam)
      : null;
    const scenario =
      scenarioOverride ?? scenarioFromParam ?? selectedScenarioRef.current ?? SCENARIOS[0];

    if (!scenario?.id || !scenario.userDescription) {
      setError('Scenario data is missing. Please refresh and try again.');
      return;
    }
      // Update URL with scenario and mode=demo
      updateScenarioInUrl(scenario.id, 'demo');
    setIsRunning(true);
    setError('');
    
    try {
      // Step 1: Create session
      setStatus('Creating session...');
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.id,
          userDescription: scenario.userDescription,
        }),
      });
      
      if (!sessionRes.ok) {
        throw new Error('Failed to create session');
      }
      
      const session = await sessionRes.json();
      const sessionId = session.id;
      
      // Step 2: Analyze image
      setStatus('Analyzing equipment image...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imagePath: scenario.imagePath,
        }),
      });
      
      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const analysis = await analyzeRes.json();
      
      // Step 3: Search KB
      setStatus('Searching knowledge base...');
      const kbRes = await fetch('/api/kb-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: scenario.kbQuery,
          maxResults: 10,
          sessionId,
        }),
      });
      
      if (!kbRes.ok) {
        throw new Error('Failed to search KB');
      }
      
      const kbData = await kbRes.json();
      
      // Step 4: Generate plan
      setStatus('Generating repair plan...');
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          observationId: analysis.observationId,
          kbResults: kbData.results,
        }),
      });
      
      if (!planRes.ok) {
        const errorData = await planRes.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }
      
      const plan = await planRes.json();
      
      // Step 5: Run safety check
      setStatus('Running safety checks...');
      const safetyRes = await fetch('/api/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planId: plan.planId,
        }),
      });
      
      if (!safetyRes.ok) {
        throw new Error('Failed to run safety check');
      }
      
      // Step 6: Create work order
      setStatus('Creating work order...');
      const woRes = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planId: plan.planId,
        }),
      });
      
      if (!woRes.ok) {
        throw new Error('Failed to create work order');
      }
      
      // Redirect to session page
      setStatus('Complete! Redirecting...');
      setTimeout(() => {
        router.push(`/session/${sessionId}`);
      }, 500);
      
    } catch (err) {
      console.error('Demo error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRunning(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    selectedScenarioRef.current = selectedScenario;
  }, [selectedScenario]);

  useEffect(() => {
    const scenarioParam = searchParams.get('scenario');
    if (!scenarioParam) return;

    const match = SCENARIOS.find((scenario) => scenario.id === scenarioParam);
    if (match) {
      setSelectedScenario(match);
    }
  }, [searchParams]);

  useEffect(() => {
    const scenarioParam = searchParams.get('scenario');
    const demoMode = searchParams.get('mode') === 'demo';

    if (!demoMode || !scenarioParam || autoRunStarted.current) return;

    const match = SCENARIOS.find((scenario) => scenario.id === scenarioParam);
    if (!match) return;

    autoRunStarted.current = true;
    runFullDemo(match);
  }, [runFullDemo, searchParams]);

  // Keep searchParams state in sync with browser navigation (back/forward)
  useEffect(() => {
    const onPop = () => setSearchParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Live Demo</h2>
        
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">Select Scenario</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario);
                  updateScenarioInUrl(scenario.id);
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
                disabled={isRunning}
              >
                <div className="font-semibold mb-1">{scenario.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {scenario.userDescription.substring(0, 60)}...
                </div>
              </button>
            ))}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Selected: {selectedScenario.name}</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {selectedScenario.userDescription}
            </p>
            <p className="text-xs text-gray-500">
              Image: {selectedScenario.imagePath}
            </p>
          </div>
          
          <button
            onClick={() => runFullDemo()}
            disabled={isRunning}
            className="btn w-full md:w-auto"
          >
            {isRunning ? 'Running Demo...' : 'Run Full Demo'}
          </button>
          
          {status && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
              {status}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
              Error: {error}
            </div>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Demo Flow</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create analysis session</li>
            <li>Analyze equipment image with Gemini Vision</li>
            <li>Search knowledge base for relevant information</li>
            <li>Generate repair plan with KB citations</li>
            <li>Run safety checks and determine PPE requirements</li>
            <li>Create work order with parts list and time estimate</li>
            <li>Display complete session with timeline and metrics</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
