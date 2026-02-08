import fs from 'fs';
import path from 'path';

export interface Manual {
  id: string;
  title?: string;
  equipment?: string;
  content?: string;
  keywords?: string[];
}

export interface Runbook {
  id: string;
  title?: string;
  procedure?: string;
  equipment?: string[];
  keywords?: string[];
}

export interface Incident {
  id: string;
  title?: string;
  problem?: string;
  resolution?: string;
  equipmentType?: string;
  keywords?: string[];
}

let manualsCache: Manual[] | null = null;
let runbooksCache: Runbook[] | null = null;
let incidentsCache: Incident[] | null = null;

export function loadManuals(): Manual[] {
  if (manualsCache) return manualsCache;
  
  try {
    const filePath = path.join(process.cwd(), 'kb', 'manuals.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    manualsCache = JSON.parse(data);
    return manualsCache || [];
  } catch (error) {
    console.error('Error loading manuals:', error);
    return [];
  }
}

export function loadRunbooks(): Runbook[] {
  if (runbooksCache) return runbooksCache;
  
  try {
    const filePath = path.join(process.cwd(), 'kb', 'runbooks.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    runbooksCache = JSON.parse(data);
    return runbooksCache || [];
  } catch (error) {
    console.error('Error loading runbooks:', error);
    return [];
  }
}

export function loadIncidents(): Incident[] {
  if (incidentsCache) return incidentsCache;
  
  try {
    const filePath = path.join(process.cwd(), 'kb', 'incidents.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    incidentsCache = JSON.parse(data);
    return incidentsCache || [];
  } catch (error) {
    console.error('Error loading incidents:', error);
    return [];
  }
}

export function getAllKBData() {
  return {
    manuals: loadManuals(),
    runbooks: loadRunbooks(),
    incidents: loadIncidents(),
  };
}
