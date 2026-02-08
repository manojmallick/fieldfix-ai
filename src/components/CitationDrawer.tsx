'use client';

import { useState } from 'react';

interface KBSnapshot {
  id: string;
  kbId: string;
  title: string;
  snippet: string;
  source: string;
  raw: string;
}

interface CitationDrawerProps {
  open: boolean;
  onClose: () => void;
  kbId: string | null;
  kbSnapshots: KBSnapshot[];
}

export default function CitationDrawer({ open, onClose, kbId, kbSnapshots }: CitationDrawerProps) {
  const [showRaw, setShowRaw] = useState(false);
  
  if (!open || !kbId) return null;
  
  const snapshot = kbSnapshots.find(s => s.kbId === kbId);
  
  if (!snapshot) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-2">Citation Not Found</h3>
          <p>Citation {kbId} not found in knowledge base snapshots.</p>
          <button onClick={onClose} className="btn mt-4">Close</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{snapshot.title}</h3>
            <div className="flex gap-2 mt-2">
              <span className="badge badge-info">{snapshot.kbId}</span>
              <span className="badge">{snapshot.source}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Content</h4>
          <p className="text-gray-700 dark:text-gray-300">{snapshot.snippet}</p>
        </div>
        
        <div>
          <button 
            onClick={() => setShowRaw(!showRaw)} 
            className="btn-secondary mb-2"
          >
            {showRaw ? 'Hide' : 'Show'} Full Details
          </button>
          
          {showRaw && (
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(JSON.parse(snapshot.raw), null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
