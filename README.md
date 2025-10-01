# Infinite 3D Explorer & English Quiz System

A comprehensive web application featuring an infinite 3D galaxy exploration system and an interactive English vocabulary quiz platform.

## Features

### 🚀 Galaxy Explorer
- **Infinite Exploration**: Navigate through procedurally generated space levels
- **Multi-Level System**: See previous and upper levels in the distance
- **Interactive Elements**:
  - Customer icons (link to websites)
  - Portal icons (⚡) - discover deeper content
  - Treasure icons (💎) - special discoveries
  - Quiz icons (📚) - take English vocabulary tests
- **Space Travel**: Immersive travel animations with sound effects
- **Dynamic Stars**: Randomly sized and colored stars that vary by level

### 📚 English Quiz System
- **JSON-Based**: Upload custom vocabulary files
- **Interactive Learning**:
  - Text-to-speech for examples
  - Volume and speed controls
  - Real-time feedback
  - 5-minute countdown timer
- **Scoring System**: Track correct answers out of total questions
- **Background Music**: Dynamic music that intensifies as time runs low

## Getting Started

### Navigation
1. Visit the home page to choose between Galaxy Explorer or English Quiz
2. **Galaxy Explorer**: Click "Start Exploring" to enter the 3D space
3. **English Quiz**: Try the sample quiz or upload your own JSON file

### Galaxy Controls
- **Mouse**: Rotate and zoom the camera
- **Click Icons**: Interact with customers, portals, or quizzes
- **Explore More Button**: Travel to new levels
- **Return Button**: Go back to previous levels

### Quiz JSON Format
\`\`\`json
[
  {
    "word": "aberrant",
    "definition": "deviating from what is normal or expected",
    "example": "The ______ behavior concerned the teacher.",
    "Persian": "منحرف، غیرعادی"
  }
]
\`\`\`

## File Structure
- `/app/page.tsx` - Galaxy exploration page
- `/app/home/page.tsx` - Home page with navigation
- `/app/pathway/page.tsx` - Pathway page for quiz window
- `/windows/english-quiz-window.tsx` - Quiz component
- `/app/api/save-quiz/route.ts` - API for saving uploaded quizzes
- `/public/quizzes/` - Stored quiz JSON files
- `/utils/` - Quiz manager, audio manager, timer manager

## Customization

### Adding Quiz Icons to Galaxy
Quiz icons are automatically generated in new levels. To add a specific quiz:
1. Upload your JSON file through the home page
2. The file is saved to `/public/quizzes/`
3. Click quiz icons (📚) in the galaxy to open them

### Modifying Star Appearance
Edit the `AnimatedStars` component in `app/page.tsx` to change:
- Star sizes (lines 280-290)
- Star colors (lines 292-304)
- Star density (line 270)

## Technologies Used
- Next.js 15
- React Three Fiber (3D rendering)
- TypeScript
- Tailwind CSS v4
- Web Audio API
- Web Speech API

## Notes
- Quiz files are saved server-side in `/public/quizzes/`
- Audio requires user interaction to enable
- Galaxy exploration supports infinite levels
- All windows in pathway system are accessible
