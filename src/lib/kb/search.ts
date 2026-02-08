import { getAllKBData, Manual, Runbook, Incident } from './dataset';

export interface KBSearchResult {
  id: string;
  title: string;
  snippet: string;
  source: 'manual' | 'runbook' | 'incident';
  score: number;
}

function scoreText(text: string | undefined, query: string): number {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  
  let score = 0;
  
  // Exact phrase match gets high score
  if (lowerText.includes(lowerQuery)) {
    score += 10;
  }
  
  // Word matches
  for (const word of words) {
    if (word.length < 3) continue; // skip short words
    if (lowerText.includes(word)) {
      score += 2;
    }
  }
  
  return score;
}

function scoreKeywords(keywords: string[] | undefined, query: string): number {
  if (!keywords || keywords.length === 0) return 0;
  
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (keyword && lowerQuery.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }
  
  return score;
}

export function searchKB(query: string, maxResults: number = 10): KBSearchResult[] {
  const { manuals, runbooks, incidents } = getAllKBData();
  const results: KBSearchResult[] = [];
  
  // Search manuals
  for (const manual of manuals) {
    let score = 0;
    score += scoreText(manual.title, query);
    score += scoreText(manual.equipment, query);
    score += scoreText(manual.content, query);
    score += scoreKeywords(manual.keywords, query);
    
    if (score > 0) {
      const snippet = (manual.content || '').substring(0, 200) + '...';
      results.push({
        id: manual.id,
        title: manual.title || 'Untitled',
        snippet,
        source: 'manual',
        score,
      });
    }
  }
  
  // Search runbooks
  for (const runbook of runbooks) {
    let score = 0;
    score += scoreText(runbook.title, query);
    score += scoreText(runbook.procedure, query);
    score += scoreText(runbook.equipment?.join(' '), query);
    score += scoreKeywords(runbook.keywords, query);
    
    if (score > 0) {
      const snippet = (runbook.procedure || '').substring(0, 200) + '...';
      results.push({
        id: runbook.id,
        title: runbook.title || 'Untitled',
        snippet,
        source: 'runbook',
        score,
      });
    }
  }
  
  // Search incidents
  for (const incident of incidents) {
    let score = 0;
    score += scoreText(incident.title, query);
    score += scoreText(incident.problem, query);
    score += scoreText(incident.resolution, query);
    score += scoreText(incident.equipmentType, query);
    score += scoreKeywords(incident.keywords, query);
    
    if (score > 0) {
      const snippet = (incident.resolution || '').substring(0, 200) + '...';
      results.push({
        id: incident.id,
        title: incident.title || 'Untitled',
        snippet,
        source: 'incident',
        score,
      });
    }
  }
  
  // Sort by score descending and limit results
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, maxResults);
}

export function formatKBResultsForPrompt(results: KBSearchResult[]): string {
  if (results.length === 0) {
    return 'No KB results found.';
  }
  
  return results
    .map((r, i) => `[${r.id}] ${r.title} (${r.source})\n${r.snippet}`)
    .join('\n\n');
}
