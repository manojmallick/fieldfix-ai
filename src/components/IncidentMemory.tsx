'use client';

interface Session {
  id: string;
  scenario: string;
  createdAt: Date;
}

interface IncidentMemoryProps {
  sessions: Session[];
}

export default function IncidentMemory({ sessions }: IncidentMemoryProps) {
  if (sessions.length === 0) {
    return null;
  }
  
  return (
    <div className="card mb-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
      <h3 className="text-xl font-semibold mb-3 text-purple-900 dark:text-purple-100">
        🧠 Incident Memory
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Similar cases found in system history
      </p>
      
      <div className="space-y-2">
        {sessions.map((s) => (
          <a 
            key={s.id}
            href={`/session/${s.id}`}
            className="block p-3 bg-white dark:bg-gray-800 rounded hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{s.scenario}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span className="text-blue-600">→</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
