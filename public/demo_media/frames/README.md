# Demo Media Frames

This directory contains demo images for the FieldFix AI scenarios.

## Required Images

Please add the following image files:
- `scenario1.jpg` - HVAC unit with visible filters/coils
- `scenario2.jpg` - Generator or backup power equipment
- `scenario3.jpg` - Industrial equipment with visible hazards (water/electrical)

These can be any relevant equipment images. The system will analyze them using Gemini Vision API.

## Temporary Placeholder

Since we cannot add actual images via code, you should:
1. Find or create 3 equipment images
2. Save them to `/public/demo_media/frames/` with the names above
3. Ensure they are JPEG format
4. Images should show relevant equipment for testing the vision analysis

For development/testing, the system will attempt to use these paths. If images are missing, you may see errors during the demo flow.
