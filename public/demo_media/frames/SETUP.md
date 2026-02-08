# FieldFix AI - Demo Images

To complete the demo setup, you need to add 3 equipment images to this directory:

## Required Files

1. **scenario1.jpg** - HVAC/Air Conditioning Unit
   - Should show cooling equipment, filters, or compressor
   - Used for overheating/airflow demo scenario

2. **scenario2.jpg** - Generator/Backup Power Equipment
   - Should show generator or electrical equipment
   - Used for startup failure demo scenario

3. **scenario3.jpg** - Equipment with Visible Hazards
   - Should show industrial equipment with water, exposed wiring, or other hazards
   - Used for safety validation demo scenario

## How to Add Images

### Option 1: Use Your Own Photos
- Take photos of relevant equipment
- Resize to reasonable dimensions (e.g., 1024x768)
- Save as JPEG files with the names above

### Option 2: Use Stock Photos
- Download from free stock photo sites (Unsplash, Pexels)
- Search for: "hvac unit", "generator", "industrial pump"
- Save with the correct filenames

### Option 3: Use Placeholder Images
If you just want to test the system without real images, you can:
1. Create simple colored rectangles as JPGs
2. Name them correctly
3. The Gemini Vision API will still analyze them (though results won't be meaningful)

## Testing Without Images

The system will throw an error if images are missing when you run the demo. To test the API flow without images, you can:
- Comment out the image analysis step in `/api/analyze/route.ts`
- Return mock observation data instead

## Important Notes

- Images must be JPEG format (.jpg)
- Keep file sizes reasonable (< 5MB each)
- Images should be clear and well-lit for best AI analysis
- The Gemini API will analyze visual details to generate observations
