const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'baby-tracker.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize database tables
db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        baby_name TEXT DEFAULT '',
        baby_dob TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        time DATETIME,
        start_time DATETIME,
        end_time DATETIME,
        duration INTEGER,
        feed_type TEXT,
        side TEXT,
        amount INTEGER,
        diaper_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS current_sleep (
        id INTEGER PRIMARY KEY DEFAULT 1,
        start_time DATETIME,
        is_active INTEGER DEFAULT 0
    );

    -- Insert default settings if not exists
    INSERT OR IGNORE INTO settings (id) VALUES (1);
    INSERT OR IGNORE INTO current_sleep (id) VALUES (1);

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
    CREATE INDEX IF NOT EXISTS idx_activities_time ON activities(time);
    CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
`);

// ============ API Routes ============

// --- Settings ---
app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        res.json(settings || { baby_name: '', baby_dob: '' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', (req, res) => {
    try {
        const { baby_name, baby_dob } = req.body;
        db.prepare(`
            UPDATE settings
            SET baby_name = ?, baby_dob = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `).run(baby_name || '', baby_dob || '');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Activities ---
app.get('/api/activities', (req, res) => {
    try {
        const { type, limit = 100, offset = 0, date } = req.query;

        let query = 'SELECT * FROM activities';
        const params = [];
        const conditions = [];

        if (type && type !== 'all') {
            conditions.push('type = ?');
            params.push(type);
        }

        if (date) {
            conditions.push("date(COALESCE(time, end_time, start_time)) = date(?)");
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY COALESCE(time, end_time, start_time) DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const activities = db.prepare(query).all(...params);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/activities', (req, res) => {
    try {
        const {
            type,
            time,
            start_time,
            end_time,
            duration,
            feed_type,
            side,
            amount,
            diaper_type,
            notes
        } = req.body;

        const result = db.prepare(`
            INSERT INTO activities (type, time, start_time, end_time, duration, feed_type, side, amount, diaper_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            type,
            time || null,
            start_time || null,
            end_time || null,
            duration || null,
            feed_type || null,
            side || null,
            amount || null,
            diaper_type || null,
            notes || null
        );

        const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/activities/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM activities WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Sleep Tracking ---
app.get('/api/sleep/current', (req, res) => {
    try {
        const currentSleep = db.prepare('SELECT * FROM current_sleep WHERE id = 1').get();
        if (currentSleep && currentSleep.is_active) {
            res.json({ startTime: currentSleep.start_time, isActive: true });
        } else {
            res.json({ isActive: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sleep/start', (req, res) => {
    try {
        const startTime = new Date().toISOString();
        db.prepare(`
            UPDATE current_sleep
            SET start_time = ?, is_active = 1
            WHERE id = 1
        `).run(startTime);
        res.json({ startTime, isActive: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sleep/end', (req, res) => {
    try {
        const currentSleep = db.prepare('SELECT * FROM current_sleep WHERE id = 1').get();

        if (!currentSleep || !currentSleep.is_active) {
            return res.status(400).json({ error: 'No active sleep session' });
        }

        const endTime = new Date().toISOString();
        const startTime = currentSleep.start_time;
        const duration = new Date(endTime) - new Date(startTime);

        // Create sleep activity
        const result = db.prepare(`
            INSERT INTO activities (type, start_time, end_time, duration)
            VALUES ('sleep', ?, ?, ?)
        `).run(startTime, endTime, duration);

        // Clear current sleep
        db.prepare(`
            UPDATE current_sleep
            SET start_time = NULL, is_active = 0
            WHERE id = 1
        `).run();

        const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Statistics ---
app.get('/api/stats/today', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Sleep stats
        const sleepStats = db.prepare(`
            SELECT
                COUNT(*) as nap_count,
                COALESCE(SUM(duration), 0) as total_sleep,
                COALESCE(AVG(duration), 0) as avg_nap
            FROM activities
            WHERE type = 'sleep'
            AND date(end_time) = date(?)
        `).get(today);

        // Current sleep if active
        const currentSleep = db.prepare('SELECT * FROM current_sleep WHERE id = 1').get();
        let currentSleepDuration = 0;
        if (currentSleep && currentSleep.is_active) {
            const sleepStart = new Date(currentSleep.start_time);
            if (sleepStart.toISOString().split('T')[0] === today) {
                currentSleepDuration = Date.now() - sleepStart.getTime();
            }
        }

        // Feed stats
        const feedStats = db.prepare(`
            SELECT
                COUNT(*) as total_feeds,
                SUM(CASE WHEN feed_type = 'breast' THEN 1 ELSE 0 END) as breast_feeds,
                SUM(CASE WHEN feed_type = 'bottle' THEN 1 ELSE 0 END) as bottle_feeds,
                COALESCE(SUM(CASE WHEN feed_type = 'bottle' THEN amount ELSE 0 END), 0) as total_ml
            FROM activities
            WHERE type = 'feed'
            AND date(time) = date(?)
        `).get(today);

        // Diaper stats
        const diaperStats = db.prepare(`
            SELECT
                COUNT(*) as total_diapers,
                SUM(CASE WHEN diaper_type = 'wet' THEN 1 ELSE 0 END) as wet_only,
                SUM(CASE WHEN diaper_type = 'dirty' THEN 1 ELSE 0 END) as dirty_only,
                SUM(CASE WHEN diaper_type = 'both' THEN 1 ELSE 0 END) as both
            FROM activities
            WHERE type = 'diaper'
            AND date(time) = date(?)
        `).get(today);

        // Wake window calculation
        const lastSleep = db.prepare(`
            SELECT end_time FROM activities
            WHERE type = 'sleep'
            ORDER BY end_time DESC
            LIMIT 1
        `).get();

        let currentWakeWindow = 0;
        if (lastSleep && (!currentSleep || !currentSleep.is_active)) {
            currentWakeWindow = Date.now() - new Date(lastSleep.end_time).getTime();
        }

        // Average wake window
        const wakeWindows = db.prepare(`
            SELECT
                a1.end_time as wake_start,
                (SELECT MIN(a2.start_time)
                 FROM activities a2
                 WHERE a2.type = 'sleep'
                 AND a2.start_time > a1.end_time) as wake_end
            FROM activities a1
            WHERE a1.type = 'sleep'
            ORDER BY a1.end_time DESC
            LIMIT 10
        `).all();

        let avgWakeWindow = 0;
        let longestWakeWindow = 0;
        const validWakeWindows = wakeWindows
            .filter(w => w.wake_end)
            .map(w => new Date(w.wake_end) - new Date(w.wake_start));

        if (validWakeWindows.length > 0) {
            avgWakeWindow = validWakeWindows.reduce((a, b) => a + b, 0) / validWakeWindows.length;
            longestWakeWindow = Math.max(...validWakeWindows);
        }

        res.json({
            sleep: {
                total: (sleepStats.total_sleep || 0) + currentSleepDuration,
                napCount: sleepStats.nap_count || 0,
                avgNap: sleepStats.avg_nap || 0
            },
            feeds: {
                total: feedStats.total_feeds || 0,
                breast: feedStats.breast_feeds || 0,
                bottle: feedStats.bottle_feeds || 0,
                totalMl: feedStats.total_ml || 0
            },
            diapers: {
                total: diaperStats.total_diapers || 0,
                wet: (diaperStats.wet_only || 0) + (diaperStats.both || 0),
                dirty: (diaperStats.dirty_only || 0) + (diaperStats.both || 0),
                wetOnly: diaperStats.wet_only || 0,
                dirtyOnly: diaperStats.dirty_only || 0,
                both: diaperStats.both || 0
            },
            wakeWindows: {
                current: currentWakeWindow,
                average: avgWakeWindow,
                longest: longestWakeWindow
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Export Data ---
app.get('/api/export', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        const activities = db.prepare('SELECT * FROM activities ORDER BY created_at DESC').all();
        const currentSleep = db.prepare('SELECT * FROM current_sleep WHERE id = 1').get();

        res.json({
            exportDate: new Date().toISOString(),
            settings,
            activities,
            currentSleep: currentSleep && currentSleep.is_active ? { startTime: currentSleep.start_time } : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Import Data ---
app.post('/api/import', (req, res) => {
    try {
        const { settings: importSettings, activities: importActivities } = req.body;

        // Begin transaction
        const transaction = db.transaction(() => {
            // Update settings
            if (importSettings) {
                db.prepare(`
                    UPDATE settings
                    SET baby_name = ?, baby_dob = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = 1
                `).run(importSettings.baby_name || '', importSettings.baby_dob || '');
            }

            // Import activities
            if (importActivities && Array.isArray(importActivities)) {
                const insertStmt = db.prepare(`
                    INSERT INTO activities (type, time, start_time, end_time, duration, feed_type, side, amount, diaper_type, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const activity of importActivities) {
                    insertStmt.run(
                        activity.type,
                        activity.time || null,
                        activity.start_time || activity.startTime || null,
                        activity.end_time || activity.endTime || null,
                        activity.duration || null,
                        activity.feed_type || activity.feedType || null,
                        activity.side || null,
                        activity.amount || null,
                        activity.diaper_type || activity.diaperType || null,
                        activity.notes || activity.text || null
                    );
                }
            }
        });

        transaction();
        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Clear All Data ---
app.delete('/api/data', (req, res) => {
    try {
        db.prepare('DELETE FROM activities').run();
        db.prepare('UPDATE settings SET baby_name = "", baby_dob = "" WHERE id = 1').run();
        db.prepare('UPDATE current_sleep SET start_time = NULL, is_active = 0 WHERE id = 1').run();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Baby Tracker server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});
