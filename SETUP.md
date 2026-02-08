# Development Setup Checklist

Follow these steps to get FieldFix AI running locally:

## 1. Install Dependencies

```bash
npm install
```

This installs Next.js, Prisma, Gemini AI SDK, and other dependencies.

## 2. Configure Environment

Edit `.env` file and add your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

Get an API key from: https://makersuite.google.com/app/apikey

## 3. Set Up Database

```bash
npx prisma migrate dev
npx prisma generate
```

This creates the SQLite database and generates the Prisma client.

## 4. Add Demo Images

Add 3 JPEG images to `/public/demo_media/frames/`:
- scenario1.jpg
- scenario2.jpg
- scenario3.jpg

See `/public/demo_media/frames/SETUP.md` for details.

## 5. Start Development Server

```bash
npm run dev
```

Server runs at http://localhost:3000

## 6. Test the Demo

1. Open http://localhost:3000/live
2. Select a scenario
3. Click "Run Full Demo"
4. Wait for processing (20-60 seconds)
5. View session dashboard with results

## Common Issues

### "GEMINI_API_KEY not set"
- Edit `.env` and add your API key
- Restart the dev server

### "Cannot read file.jpg"
- Add the required demo images
- Check that filenames match exactly

### "Prisma client not generated"
- Run: `npx prisma generate`

### "Database does not exist"
- Run: `npx prisma migrate dev`

### TypeScript errors
- Run: `npm install` again
- Delete `node_modules` and `.next`, then reinstall

## Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.0-flash-exp`
   - `DEMO_ONLY=1`
4. Deploy

The demo images should be committed to the repo so they're available on Vercel.

## Next Steps

- Customize KB files in `/kb` directory
- Adjust safety rules in `/src/lib/safety/rules.ts`
- Modify prompts in `/src/lib/prompts.ts`
- Update scenarios in `/src/app/live/page.tsx`
- Style improvements in `/src/app/globals.css`

## Need Help?

- Check README.md for full documentation
- Review COPILOT_PLAN.md for architecture details
- Test individual API endpoints with curl/Postman
- Check browser console and terminal for errors
