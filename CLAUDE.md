# CLAUDE.md - AI Assistant Guidelines

This document provides comprehensive guidance for AI assistants working with this repository.

## Repository Overview

This repository contains two distinct components:

1. **Baby Activity Tracker** - A Progressive Web App (PWA) for tracking infant care activities
2. **Geospatial Data** - GeoJSON files containing continent boundary data

## Project Structure

```
/
├── index.html                                    # Main Baby Tracker application (HTML/CSS/JS)
├── manifest.json                                 # PWA configuration
├── map_of_continents.png                        # Continent map image asset
├── continent_Africa_subunits.json               # GeoJSON - Africa boundaries
├── continent_Antarctica_subunits.json           # GeoJSON - Antarctica boundaries
├── continent_Asia_subunits.json                 # GeoJSON - Asia boundaries
├── continent_Europe_subunits.json               # GeoJSON - Europe boundaries
├── continent_North_America_subunits.json        # GeoJSON - North America boundaries
├── continent_Oceania_subunits.json              # GeoJSON - Oceania boundaries
├── continent_South_America_subunits.json        # GeoJSON - South America boundaries
└── continent_seven_seas_open_ocean_subunits.json # GeoJSON - Ocean boundaries
```

## Technology Stack

### Baby Tracker Application
- **HTML5** - Semantic markup with PWA meta tags
- **CSS3** - Embedded styles using CSS variables, Flexbox, Grid, animations
- **Vanilla JavaScript (ES6+)** - No frameworks or external dependencies
- **localStorage API** - Client-side data persistence
- **PWA** - Progressive Web App with manifest for installability

### Geospatial Data
- **GeoJSON** - Standard format for geographic feature collections
- Total size: ~15MB across 8 continent files

## Development Guidelines

### No Build Process
This is a static web application with zero build dependencies:
- No npm/node_modules
- No transpilation (TypeScript, Babel)
- No bundling (Webpack, Vite)
- Files run directly in the browser

### Running the Application
Serve the files with any static HTTP server:
```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```
Then open `http://localhost:8000/index.html`

### Code Organization
All application code resides in `index.html`:
- **Lines 1-10**: Document head, meta tags, manifest link
- **Lines 11-720**: Embedded `<style>` block with all CSS
- **Lines 722-946**: HTML structure (pages, modals, navigation)
- **Lines 1085-1767**: Embedded `<script>` block with all JavaScript

### CSS Conventions
- **CSS Variables**: Defined in `:root` for theming (lines 18-33)
  - `--primary`: #6366f1 (indigo)
  - `--sleep`, `--feed`, `--diaper-*`: Activity type colors
  - `--bg`, `--card`, `--text`, `--border`: Layout colors
- **Naming**: BEM-inspired class names (`.status-card`, `.action-btn`, `.log-item`)
- **Layout**: Mobile-first with Flexbox and CSS Grid
- **Responsive**: Media query at 768px for tablet/desktop

### JavaScript Conventions
- **State Management**: Global variables at script start
  ```javascript
  let activities = [];        // Activity log array
  let currentSleep = null;    // Active sleep session
  let settings = {};          // User preferences
  let selectedOptions = {};   // Form state
  ```
- **Function Naming**: camelCase with action verbs
  - `loadData()`, `saveData()`, `updateUI()`
  - `openFeedModal()`, `saveFeed()`, `closeModal()`
- **DOM Access**: Direct `getElementById()` calls
- **Event Handling**: Inline `onclick` attributes for simplicity

### Data Persistence
localStorage keys (prefixed with `babyTracker_`):
- `babyTracker_activities` - JSON array of activity records
- `babyTracker_settings` - JSON object with baby name, DOB
- `babyTracker_currentSleep` - JSON object for active sleep session

### Activity Data Schema
```javascript
// Sleep activity
{
  id: Number,           // timestamp ID
  type: 'sleep',
  startTime: ISO8601,   // sleep start
  endTime: ISO8601,     // sleep end
  duration: Number      // milliseconds
}

// Feed activity
{
  id: Number,
  type: 'feed',
  feedType: 'breast' | 'bottle' | 'solids',
  time: ISO8601,
  side?: 'left' | 'right' | 'both',  // for breast
  duration?: Number,                   // minutes, for breast
  amount?: Number,                     // ml, for bottle
  notes?: String
}

// Diaper activity
{
  id: Number,
  type: 'diaper',
  diaperType: 'wet' | 'dirty' | 'both' | 'dry',
  time: ISO8601,
  notes?: String
}

// Note activity
{
  id: Number,
  type: 'note',
  time: ISO8601,
  text: String
}
```

## Key Application Features

### Pages (SPA Navigation)
1. **Home** (`page-home`) - Current status, quick actions, daily summary, recent log
2. **History** (`page-history`) - Full activity log with filtering by type
3. **Stats** (`page-stats`) - Sleep, feeding, diaper, and wake window statistics
4. **Settings** (`page-settings`) - Baby info, data export, clear data

### Modals
- `feedModal` - Log feeding with type, side/amount, duration, notes
- `diaperModal` - Log diaper change with type and notes
- `noteModal` - Add free-form timestamped notes

### Key Functions
| Function | Purpose |
|----------|---------|
| `loadData()` / `saveData()` | localStorage persistence |
| `toggleSleep()` | Start/end sleep tracking |
| `updateUI()` | Refresh all UI components |
| `updateTodaySummary()` | Calculate daily stats |
| `renderRecentLog()` | Display last 5 activities |
| `renderHistory()` | Full activity list with date grouping |
| `updateStats()` | Calculate statistics page metrics |
| `exportData()` | Download JSON backup |

## Working with GeoJSON Files

The continent GeoJSON files follow standard GeoJSON FeatureCollection format:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { ... },
      "geometry": { "type": "Polygon", "coordinates": [...] }
    }
  ]
}
```

These files are currently standalone data assets and are not integrated with the Baby Tracker application.

## Common Tasks

### Adding a New Activity Type
1. Add CSS color variable in `:root` (line ~18)
2. Create button in `.actions-grid` (line ~744)
3. Create modal overlay (follow existing modal patterns)
4. Add state variable and save/load functions
5. Update `renderActivityItem()` switch statement
6. Update statistics calculations if needed

### Modifying Styling
1. Find relevant CSS in the `<style>` block (lines 11-720)
2. Prefer modifying CSS variables in `:root` for global changes
3. Test on mobile viewport (375px width) first

### Adding Settings
1. Add HTML input in `page-settings` section
2. Add property to `settings` object
3. Update `loadData()` to restore value
4. Create save handler function
5. Call `saveData()` on change

## Testing

No automated testing is configured. Manual testing approach:
1. Open in mobile browser or device emulator
2. Test all CRUD operations for each activity type
3. Verify localStorage persistence (reload page)
4. Test PWA installation on mobile device
5. Verify export/import functionality

## PWA Configuration

`manifest.json` defines:
- App name: "Baby Tracker"
- Display mode: standalone (fullscreen)
- Orientation: portrait
- Theme color: #6366f1
- Icon: SVG emoji baby (data URI)

## Important Notes for AI Assistants

1. **Single-file architecture**: All application code is in `index.html`. Do not create separate CSS/JS files unless specifically requested.

2. **No dependencies**: Do not suggest adding npm packages or external libraries without explicit user request.

3. **Mobile-first**: Always consider mobile viewport and touch interactions first.

4. **Data safety**: The `confirmClearData()` function has double confirmation intentionally. Preserve this pattern for destructive operations.

5. **Emoji usage**: The UI uses emojis for icons. This is intentional for simplicity and cross-platform compatibility.

6. **GeoJSON files**: These are large (~15MB total) and separate from the Baby Tracker. Do not attempt to load them into the application without user guidance.

7. **localStorage limits**: Browser localStorage is limited (~5-10MB). For heavy users, the activities array could grow large over time.

8. **No backend**: This is entirely client-side. Do not suggest server-side features without understanding the offline-first design goal.

## Git Workflow

- Main development happens on feature branches
- Commit messages should be descriptive and focus on "why"
- Test locally before committing changes
