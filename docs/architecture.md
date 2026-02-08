# FieldFix AI Architecture

```mermaid
flowchart LR
  subgraph Client[Browser / Next.js App]
    UI[App Router Pages]
    UI --> NAV[Session Nav + Evidence UI]
    UI --> LIVE[Live Demo Flow]
  end

  subgraph API[Next.js Route Handlers]
    ANALYZE[/api/analyze]
    KB[/api/kb-search]
    PLAN[/api/plan]
    SAFETY[/api/safety]
    QA[/api/qa]
    WO[/api/workorders]
  end

  subgraph Core[Core Libraries]
    GEMINI[Gemini Client + Calls]
    RULES[Safety Rules Engine]
    KBSEARCH[KB Search + Snapshot]
    SCHEMAS[Zod Schemas]
  end

  subgraph DB[(SQLite + Prisma)]
    SESSION[Session]
    OBS[Observation]
    PLANM[Plan]
    SAFEM[SafetyCheck]
    WOM[WorkOrder]
    EVENTS[Event]
    SNAP[KBSnapshot]
  end

  UI --> API
  API --> Core
  Core --> GEMINI
  Core --> RULES
  Core --> KBSEARCH
  API --> DB

  ANALYZE --> OBS
  KB --> SNAP
  PLAN --> PLANM
  SAFETY --> SAFEM
  QA --> EVENTS
  WO --> WOM
  ANALYZE --> EVENTS
  PLAN --> EVENTS
  KB --> EVENTS

  GEMINI --> ANALYZE
  GEMINI --> PLAN
  GEMINI --> QA
  RULES --> SAFETY
  KBSEARCH --> KB
```

## Notes
- UI pages surface evidence panels, citations, and QA results.
- API routes validate responses with Zod and log timing/metadata in events.
- KB snapshots persist citations for auditability.
