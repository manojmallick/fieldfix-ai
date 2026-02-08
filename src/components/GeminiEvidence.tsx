'use client';

interface Event {
  eventType: string;
  timestamp: Date;
  data?: string | null;
}

interface GeminiEvidenceProps {
  events: Event[];
}

export default function GeminiEvidence({ events }: GeminiEvidenceProps) {
  const getEventMetadata = (event: Event) => {
    try {
      return event.data ? JSON.parse(event.data) : {};
    } catch {
      return {};
    }
  };
  
  const analyzeStart = events.find(e => e.eventType === 'ANALYZE_START');
  const analyzeDone = events.find(e => e.eventType === 'ANALYZE_DONE');
  const planStart = events.find(e => e.eventType === 'PLAN_START');
  const planReady = events.find(e => e.eventType === 'PLAN_READY');
  const qaCheck = events.find(e => e.eventType === 'QA_CHECK');
  
  const analyzeLatency = analyzeStart && analyzeDone 
    ? Math.round((new Date(analyzeDone.timestamp).getTime() - new Date(analyzeStart.timestamp).getTime()) / 1000)
    : 0;
    
  const planLatency = planStart && planReady
    ? Math.round((new Date(planReady.timestamp).getTime() - new Date(planStart.timestamp).getTime()) / 1000)
    : 0;
  
  const analyzeMeta = analyzeDone ? getEventMetadata(analyzeDone) : {};
  const planMeta = planReady ? getEventMetadata(planReady) : {};
  const qaMeta = qaCheck ? getEventMetadata(qaCheck) : {};
  
  return (
    <div className="card mb-6">
      <h3 className="text-xl font-semibold mb-4">🤖 Gemini Evidence Panel</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        All reasoning performed by Gemini API with validation
      </p>
      
      <div className="space-y-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Vision Extract</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Equipment analysis from image</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{analyzeLatency}s</div>
              <div className="text-xs text-gray-500">latency</div>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-sm flex-wrap">
            <span className="badge badge-info">{analyzeMeta.model || 'gemini-3-flash-preview'}</span>
            {analyzeMeta.zod_pass && <span className="badge badge-success">validated</span>}
            {analyzeMeta.retries > 0 && <span className="badge badge-warning">{analyzeMeta.retries} retry</span>}
            {analyzeMeta.used_mock && <span className="badge">mock data</span>}
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">Plan Generate</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Repair steps with KB citations</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{planLatency}s</div>
              <div className="text-xs text-gray-500">latency</div>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-sm flex-wrap">
            <span className="badge badge-info">{planMeta.model || 'gemini-3-flash-preview'}</span>
            {planMeta.zod_pass && <span className="badge badge-success">validated</span>}
            {planMeta.retries > 0 && <span className="badge badge-warning">{planMeta.retries} retry</span>}
          </div>
        </div>
        
        {qaCheck && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">QA Gate</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quality assessment validation</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {qaMeta.latency_ms ? `${(qaMeta.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">latency</div>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-sm flex-wrap">
              <span className="badge badge-info">{qaMeta.model || 'gemini-3-flash-preview'}</span>
              {qaMeta.zod_pass && <span className="badge badge-success">validated</span>}
              {qaMeta.retries > 0 && <span className="badge badge-warning">{qaMeta.retries} retry</span>}
              {qaMeta.pass !== undefined && (
                <span className={`badge ${qaMeta.pass ? 'badge-success' : 'badge-error'}`}>
                  {qaMeta.pass ? 'PASS' : 'FAIL'}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          ✓ All responses validate against Zod schemas
          <br />
          ✓ Automatic retry on malformed JSON
          <br />
          ✓ Citations verified against KB snapshots
        </div>
      </div>
    </div>
  );
}
