# FieldFix AI

AI-powered field service equipment analysis and repair planning system. Demonstrates Gemini 2.0 as the core reasoning engine with multimodal analysis, knowledge base retrieval, cited repair plans, safety validation, and automated work order generation.

## Features

- **Multimodal Analysis**: Vision AI analyzes equipment images to identify problems and risks
- **Knowledge Base Integration**: Searches manuals, runbooks, and incident reports
- **Cited Repair Plans**: Step-by-step plans with KB citations for every step
- **Safety Validation**: Automated safety checks with PPE and hazard identification
- **Work Order Generation**: Automatic parts lists and time estimates
- **Timeline & Metrics**: Track execution time and efficiency gains vs baseline

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Gemini 2.0 API** via `@google/generative-ai`
- **Prisma** + SQLite (local dev)
- **TailwindCSS** for UI
- **Zod** for schema validation

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go to `/live`.

## Demo Flow

1. Open `/live`
2. Select a scenario
3. Click "Run Full Demo"
4. Review the session pages: Overview → Plan → Safety → Work Order → QA Gate → Metrics

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Local Development

1. **Clone and install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3-flash-preview
DATABASE_URL="file:./dev.db"
DEMO_ONLY=0
```

3. **Set up database**

```bash
npx prisma migrate dev
npx prisma generate
```

4. **Add demo images (OPTIONAL)**

**The demo now works without actual images!** If demo images are missing, the system automatically uses realistic mock observation data, so you can run the full demo immediately.

To test with real Gemini Vision analysis (optional):
- Add 3 equipment images to `/public/demo_media/frames/`:
  - `scenario1.jpg` - HVAC/cooling equipment
  - `scenario2.jpg` - Generator/power equipment  
  - `scenario3.jpg` - Equipment with visible hazards
- Or run: `node scripts/create-placeholders.js` to create minimal placeholder JPEGs

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Try the demo**

- Go to `/live` 
- Select a scenario
- Click "Run Full Demo"
- View results in the session dashboard

## Demo Mode

The `/live` page provides a one-click demo that:

1. Creates a new session
2. Analyzes equipment image with Gemini Vision (or uses mock data if images missing)
3. Searches knowledge base for relevant info
4. Generates repair plan with citations
5. Runs safety validation
6. Creates work order
7. Redirects to session dashboard with timeline

**No images required!** The system automatically detects missing images and uses realistic mock observation data for each scenario. This allows you to test the complete workflow immediately without adding actual equipment photos.

## Project Structure

```
fieldfix-ai/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API route handlers
│   │   ├── session/[id]/      # Session detail pages
│   │   ├── live/              # Demo page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   └── lib/
│       ├── gemini/            # Gemini API client & helpers
│       ├── kb/                # Knowledge base loader & search
│       ├── safety/            # Safety rules engine
│       ├── schemas/           # Zod validation schemas
│       ├── utils/             # JSON parsing utilities
│       ├── prompts.ts         # Inline prompts (no fs reads)
│       └── db.ts              # Prisma client
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # DB migrations
├── kb/                        # Knowledge base JSON files
│   ├── manuals.json
│   ├── runbooks.json
│   └── incidents.json
└── public/
    └── demo_media/
        └── frames/            # Demo scenario images
```

## API Endpoints

- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Get session details
- `POST /api/analyze` - Analyze equipment image
- `POST /api/kb-search` - Search knowledge base
- `POST /api/plan` - Generate repair plan
- `POST /api/qa` - Quality assurance check (optional)
- `POST /api/safety` - Run safety validation
- `POST /api/workorders` - Create work order
- `POST /api/events` - Log timeline event
- `POST /api/upload` - Upload handler (disabled in demo mode)

## Vercel Deployment

### Environment Variables

Set these in Vercel project settings:

```
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3-flash-preview
DATABASE_URL="file:./dev.db"
DEMO_ONLY=1
```

### Deploy

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

The `vercel.json` config handles:
- Prisma generation during build
- Setting `DEMO_ONLY=1` environment variable
- Proper build command execution

**Important**: On Vercel, the SQLite database is ephemeral. Each deployment starts fresh. This is acceptable for demo purposes. For production, use a persistent database like PostgreSQL.

### Access Demo

Once deployed, visit:
```
https://your-app.vercel.app/live
```

## Key Implementation Details

### Inline Prompts (Vercel-Safe)

All prompts are in `src/lib/prompts.ts` as exported strings - no filesystem reads at runtime.

### JSON Validation + Retry

All Gemini responses are:
1. Parsed with `safeJsonParse()` utility
2. Validated with Zod schemas
3. Retried once with `FIX_JSON_PROMPT` if parsing fails

### KB Search with Citations

Every plan step must include `citations` array with KB IDs. The search system returns stable IDs (KB1, KB2, etc.) that are referenced in the plan.

### Safety Rules

Deterministic safety checks examine:
- Risk flags from observation
- Plan step keywords (electrical, height, etc.)
- Output: PPE requirements, hazards, required pre-steps

### Metrics Tracking

Events table logs all operations with timestamps for calculating:
- Analysis latency
- Plan generation time
- End-to-end duration
- Time saved vs 35-minute baseline

## Acceptance Criteria

✅ Local: `npm install && npx prisma migrate dev && npm run dev`  
✅ Navigate to `/live`, select scenario, click "Run Full Demo"  
✅ Redirects to `/session/:id` showing timeline  
✅ Plan page shows ≥3 steps with citations  
✅ Safety page shows required presteps for hazardous scenarios  
✅ Work order shows WO-###### number  
✅ Metrics page shows latency and time saved  
✅ Vercel: With `DEMO_ONLY=1`, demo works without uploads  
✅ `/api/upload` returns 403 in demo mode  

## Troubleshooting

**Gemini API errors**: Verify your API key in `.env`

**Database errors**: Run `npx prisma migrate dev` and `npx prisma generate`

**Missing images**: ✅ **Fixed!** The system now automatically uses mock data when images are missing. To create placeholder images anyway, run: `node scripts/create-placeholders.js`

**JSON parsing errors**: Check Gemini responses - retry logic should handle most issues

**TypeScript errors**: Run `npm install` to ensure all dependencies are installed

## Development Notes

- Demo mode uses pre-loaded scenarios (no uploads needed)
- KB files are loaded at runtime from `/kb` directory
- All prompts are inline (no fs.readFile in API routes)
- Zod validates all AI responses
- Safety rules are deterministic (no AI calls)
- Session status: `created` → `analyzing` → `planning` → `complete`

## License

Demo application - MIT License

## Support

For issues or questions, check:
- Gemini API docs: https://ai.google.dev/docs
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
