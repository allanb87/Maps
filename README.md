# Baby Tracker

A mobile-friendly web application for tracking your baby's activities including sleep, feeding, diaper changes, and notes.

## Features

- **Sleep Tracking**: Start/stop sleep timer with automatic duration calculation
- **Feeding Logs**: Track breast feeds (side, duration), bottle feeds (amount), and solids
- **Diaper Changes**: Log wet, dirty, or both types of diaper changes
- **Notes**: Add general observations about your baby
- **Daily Summary**: View today's totals at a glance
- **Statistics**: Detailed stats including wake windows, feeding patterns, and more
- **Activity History**: Browse and filter past activities by type
- **Data Export**: Export all data as JSON for backup
- **Offline Support**: Falls back to localStorage if server is unavailable
- **PWA Ready**: Install as an app on your phone

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

### Deploy to Render.com (Recommended - Free Tier)

1. Push this code to a GitHub repository
2. Go to [render.com](https://render.com) and create a new account
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Render will auto-detect the configuration from `render.yaml`
6. Click "Create Web Service"

Your app will be live at `https://your-app-name.onrender.com`

**Note**: The free tier may spin down after inactivity. First request after sleep may be slow.

### Deploy to Railway

1. Push this code to a GitHub repository
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add a volume for persistent data:
   - Go to your service settings
   - Add a volume mounted at `/app/data`

### Deploy with Docker

```bash
# Build the image
docker build -t baby-tracker .

# Run with a persistent volume for the database
docker run -d \
  -p 3000:3000 \
  -v baby-tracker-data:/app/data \
  --name baby-tracker \
  baby-tracker
```

### Deploy to Fly.io

1. Install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Run:
   ```bash
   fly launch
   fly volumes create baby_tracker_data --size 1
   fly deploy
   ```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (mobile-first design)
- **Backend**: Node.js with Express
- **Database**: SQLite (via better-sqlite3)
- **Deployment**: Docker-ready, Render/Railway/Fly.io compatible

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get baby settings |
| PUT | /api/settings | Update settings |
| GET | /api/activities | Get activities (supports ?type=&limit=&offset=) |
| POST | /api/activities | Create new activity |
| DELETE | /api/activities/:id | Delete an activity |
| GET | /api/sleep/current | Get current sleep status |
| POST | /api/sleep/start | Start sleep timer |
| POST | /api/sleep/end | End sleep timer |
| GET | /api/stats/today | Get today's statistics |
| GET | /api/export | Export all data |
| POST | /api/import | Import data |
| DELETE | /api/data | Clear all data |

## Data Persistence

- **Server Mode**: Data is stored in SQLite database (`data/baby-tracker.db`)
- **Offline Mode**: Falls back to browser localStorage if server is unavailable

## License

MIT
