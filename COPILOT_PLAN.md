You are a senior full-stack engineer working inside this repo: FieldFix AI.
Goal: produce a judge-proof, Vercel-deployable Next.js (App Router) app that demonstrates Gemini 3 as the core reasoning engine: multimodal analysis → KB retrieval → cited plan → safety gate → work order → timeline + metrics. Must be one-click demo with /live?mode=demo.

IMPORTANT CONSTRAINTS (must obey):
- Target deployment: Vercel. Use DEMO_ONLY=1 on Vercel. Do NOT rely on writing to disk or persistent SQLite for demo flow.
- The deployed demo must work without uploads (use /public/demo_media/frames/*.jpg).
- API routes must not read prompt files from filesystem on Vercel; inline prompts in TS exports.
- Always validate model JSON with Zod and implement 1 retry for malformed JSON.
- Every plan step must contain >=1 citations entry from KB results.
- Provide /live “Run Full Demo” button that completes: create session → analyze → KB search → plan → safety rules → work order → redirect to /session/:id.
- Provide Session dashboard with Timeline and links to Plan/Safety/WorkOrder/Metrics pages.
- Use Tailwind dashboard styling (clean, minimal).
- Keep scope tight; no auth, no third-party ticket integrations, no streaming WebRTC. Demo-mode frames only.

TECH STACK (final):
- Next.js (App Router) + TypeScript
- TailwindCSS
- Prisma + SQLite (local dev); ok if ephemeral on Vercel
- Zod schemas
- Gemini API using @google/genai (GoogleGenAI) with generateContent
- KB stored as JSON files under /kb, loaded at runtime (read-only)

ENV VARS:
- GEMINI_API_KEY
- GEMINI_MODEL (default gemini-3-flash-preview)
- DATABASE_URL="file:./dev.db"
- DEMO_ONLY=1 (on Vercel)
- NEXT_PUBLIC_BASE_URL optional (only if internal fetch needs absolute URLs)

DELIVERABLES:
1) Vercel-ready config:
   - Add vercel.json with buildCommand: "prisma migrate deploy && next build"
   - Add package.json postinstall: "prisma generate"
2) Inline prompts:
   - Create src/lib/prompts.ts exporting VISION_PROMPT, PLAN_PROMPT, QA_PROMPT as template strings.
   - Update /api/analyze, /api/plan, /api/qa to import prompts from src/lib/prompts.ts (NO fs reads).
3) KB loader + search:
   - Implement src/lib/kb/dataset.ts to load kb/manuals.json, kb/runbooks.json, kb/incidents.json (server-side file reads OK).
   - Implement src/lib/kb/search.ts: simple keyword scoring across title/content/keywords/procedure/resolution; returns {id,title,snippet,source} list; add KB id format "KB1..".
   - Ensure KB results always include stable ids used for citations.
4) Gemini client + calls:
   - Implement src/lib/gemini/client.ts: getGeminiClient() and getGeminiModelName()
   - Implement src/lib/gemini/parts.ts: fileToInlineDataPart(filePath,mimeType) -> { inlineData:{data,mimeType} }
   - Implement src/lib/gemini/calls.ts: geminiVisionJson(), geminiJsonFromText()
   - Ensure API routes pass contents in correct format: [{role:"user", parts:[{text:prompt}, inlineDataPart]}].
5) Zod schemas + parsing:
   - Ensure src/lib/schemas/*.ts exist: observation.schema.ts, plan.schema.ts, qa.schema.ts, safety.schema.ts
   - Ensure src/lib/utils/json.ts includes extractFirstJson(), safeJsonParse()
   - Add ONE retry in analyze/plan/qa routes: if JSON parse or schema validation fails, call Gemini again with a “FIX_JSON” prompt that includes the invalid output and instructs to output corrected JSON only.
6) Prisma schema + migrations:
   - Ensure prisma/schema.prisma has models: Session, Media, Observation, Plan, SafetyCheck, WorkOrder, Event (as previously designed).
   - Ensure prisma migrations exist and are committed.
   - Ensure prisma/seed.ts exists for local dev.
7) API routes:
   - Ensure these Next route handlers exist and work:
     - POST /api/sessions
     - GET /api/sessions/[id]
     - POST /api/analyze
     - POST /api/kb-search
     - POST /api/plan
     - POST /api/qa (optional but should exist)
     - POST /api/safety (deterministic rules)
     - POST /api/workorders
     - POST /api/events
     - POST /api/upload: disable when DEMO_ONLY=1 with HTTP 403 and message.
   - Each route must log events to Event table: SESSION_CREATED, ANALYZE_START, ANALYZE_DONE, PLAN_START, PLAN_READY, SAFETY_DONE, WO_CREATED.
8) Safety rules:
   - Implement src/lib/safety/rules.ts: runSafetyRules({riskFlags, planSteps}) returning {pass,ppe_required,hazards,required_presteps}.
   - Hard rules:
     - If riskFlags includes "water_near_power": hazards includes "electrocution"; required_presteps includes "Isolate power & keep area dry"; ppe includes "insulated gloves"; pass=true but requires presteps.
     - If riskFlags includes "exposed_wires": hazards includes "shock"; required_presteps includes "Lockout/Tagout before contact"; ppe includes "insulated gloves".
     - Always add "Lockout/Tagout" as a required_prestep if plan contains opening panels or electrical checks (detect keywords: "open panel","wiring","multimeter","power module").
9) UI pages (wired):
   - Landing page: / with Start Demo button
   - /live page:
     - Has dropdown scenarios mapped to:
       /public/demo_media/frames/scenario1.jpg etc.
       user_description and kb query string per scenario.
     - Run Full Demo button executes client-side sequence:
       create session → analyze → kb-search → plan → safety → workorders → redirect to /session/:id
   - /session/[id] Overview:
     - Fetch session via /api/sessions/[id] (or server-side direct prisma call, preferred to avoid internal HTTP).
     - Render SessionNav links, Observation summary, and Timeline list of events.
   - /session/[id]/plan:
     - Render plan steps with citations
   - /session/[id]/safety:
     - Render pass/fail + PPE + hazards + required presteps
   - /session/[id]/workorder:
     - Render WO id + summary + parts list
   - /session/[id]/metrics:
     - Compute basic metrics from Event timestamps: plan latency, end-to-end time, estimated time saved vs baseline=35min
10) Styling:
   - Tailwind base components in globals.css: .container .card .btn .btn-secondary .badge
   - Ensure layout.tsx uses clean header + nav
11) Demo assets:
   - Ensure public/demo_media/frames/scenario1.jpg, scenario2.jpg, scenario3.jpg exist (can duplicate initially).
   - Ensure /kb JSON files exist with at least 10 entries total so KB search returns results.
12) Deployment:
   - Add vercel.json buildCommand.
   - Ensure README includes /live?mode=demo link and setup instructions.

ACCEPTANCE CRITERIA (must pass):
- Local: npm install; npx prisma migrate dev; npm run dev; open /live?mode=demo; click Run Full Demo; redirected to /session/:id showing events.
- Plan page shows >=3 steps and each step has citations.
- Safety page shows required presteps for scenario3 (water_near_power).
- Work order page shows WO-#### created.
- Metrics page shows plan latency and estimated time saved.
- Vercel: with DEMO_ONLY=1, /live?mode=demo works without upload; /api/upload returns 403.

TASK ORDER (do in this order):
1) Add src/lib/prompts.ts and patch API routes to stop filesystem prompt reads.
2) Implement KB loader + search so citations work.
3) Add JSON validation + retry in analyze/plan/qa.
4) Ensure Prisma migrations are committed and vercel.json buildCommand is added.
5) Verify one-click demo flow fully works and pages render artifacts.

NOW DO:
- If any of these files are missing, create them.
- If any endpoint mismatches UI expectations, align them.
- Keep changes minimal and stable. Prefer deterministic behavior over fancy features.
- After implementing, run through the acceptance checklist above and fix any failing step.
