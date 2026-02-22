const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'registrations.json');
const DB_FILE = path.join(__dirname, 'taiseel.db');

const DEFAULT_UNITS = [
    ['101', 1, 'Studio', 520, 'occupied', 540000, 1850, '2023-07-03'],
    ['102', 1, '1 Bed', 850, 'occupied', 850000, 2800, '2023-06-15'],
    ['103', 1, '2 Bed', 1180, 'occupied', 1180000, 3800, '2024-01-22'],
    ['104', 1, '2 Bed', 1200, 'vacant', 1200000, 3900, '2024-05-30'],
    ['201', 2, 'Studio', 530, 'occupied', 555000, 1900, '2023-03-14'],
    ['202', 2, '1 Bed', 870, 'occupied', 890000, 2950, '2023-11-21'],
    ['203', 2, '2 Bed', 1200, 'listed', 1220000, 3950, '2025-01-12'],
    ['204', 2, '3 Bed', 1650, 'occupied', 1680000, 5200, '2024-09-05'],
    ['301', 3, '1 Bed', 870, 'occupied', 910000, 3000, '2024-02-18'],
    ['302', 3, '2 Bed', 1200, 'occupied', 1240000, 4000, '2023-08-09'],
    ['303', 3, '3 Bed', 1670, 'occupied', 1720000, 5350, '2024-10-10'],
    ['304', 3, '2 Bed', 1190, 'occupied', 1230000, 3980, '2023-12-01'],
    ['401', 4, '1 Bed', 875, 'occupied', 930000, 3100, '2025-02-03'],
    ['402', 4, '2 Bed', 1210, 'occupied', 1260000, 4100, '2024-11-18'],
    ['403', 4, '3 Bed', 1680, 'vacant', 1750000, 5500, '2025-01-25'],
    ['404', 4, '2 Bed', 1195, 'occupied', 1250000, 4050, '2024-03-28'],
    ['501', 5, '2 Bed', 1400, 'occupied', 1480000, 4600, '2025-02-02'],
    ['502', 5, 'Penthouse', 2200, 'occupied', 2400000, 7200, '2024-12-15'],
    ['601', 6, 'Penthouse', 2400, 'occupied', 2700000, 7800, '2025-01-17'],
    ['602', 6, 'Penthouse', 2350, 'occupied', 2640000, 7580, '2024-08-29']
];

const DEFAULT_VAL_HISTORY = [
    ['2019', 11900000, 41000, 598000],
    ['2020', 12300000, 39800, 614000],
    ['2021', 15800000, 46000, 790000],
    ['2022', 18400000, 53500, 920000],
    ['2023', 20100000, 57800, 1005000],
    ['2024', 22200000, 62100, 1110000],
    ['2025', 24120000, 67320, 1206000]
];

const db = new DatabaseSync(DB_FILE);

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL UNIQUE,
            floor INTEGER NOT NULL,
            type TEXT NOT NULL,
            sqft INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('occupied', 'vacant', 'listed')),
            value INTEGER NOT NULL,
            rent INTEGER NOT NULL,
            last_sold_at TEXT
        );

        CREATE TABLE IF NOT EXISTS valuation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE,
            total_value INTEGER NOT NULL,
            rent_roll INTEGER NOT NULL,
            per_unit_avg INTEGER NOT NULL
        );
    `);

    const unitCount = db.prepare('SELECT COUNT(*) AS count FROM units').get().count;
    if (unitCount === 0) {
        const insertUnit = db.prepare(`
            INSERT INTO units (unit_code, floor, type, sqft, status, value, rent, last_sold_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const entry of DEFAULT_UNITS) {
            insertUnit.run(...entry);
        }
    }

    const historyCount = db.prepare('SELECT COUNT(*) AS count FROM valuation_history').get().count;
    if (historyCount === 0) {
        const insertHistory = db.prepare(`
            INSERT INTO valuation_history (label, total_value, rent_roll, per_unit_avg)
            VALUES (?, ?, ?, ?)
        `);

        for (const entry of DEFAULT_VAL_HISTORY) {
            insertHistory.run(...entry);
        }
    }
}

initDatabase();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

async function readRegistrations() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }

        if (error.name === 'SyntaxError') {
            console.error('Registration data is corrupted. Falling back to empty array.');
            return [];
        }

        throw error;
    }
}

async function writeRegistrations(registrations) {
    await fs.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2), 'utf8');
}

function normalizeRegistration(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(payload)) {
        const safeKey = String(key).trim();
        if (!safeKey) continue;

        cleaned[safeKey] = typeof value === 'string' ? value.trim() : value;
    }

    const firstName = cleaned['First Name'];
    const lastName = cleaned['Last Name'];
    const email = cleaned['Email Address'] || cleaned.Email;

    if (!firstName || !lastName || !email) {
        return null;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
        return null;
    }

    cleaned['Email Address'] = normalizedEmail;
    delete cleaned.Email;
    cleaned.timestamp = new Date().toISOString();

    return cleaned;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasDuplicateEmail(registrations, email) {
    const target = String(email).trim().toLowerCase();

    return registrations.some((entry) => {
        const existing = entry?.['Email Address'] || entry?.Email;
        if (!existing) return false;
        return String(existing).trim().toLowerCase() === target;
    });
}

function normalizeStoredRegistration(payload) {
    const normalized = normalizeRegistration(payload);

    if (normalized) {
        return normalized;
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }

    const fallback = { ...payload };

    if (!fallback['Email Address'] && fallback.Email) {
        fallback['Email Address'] = fallback.Email;
    }

    if (!fallback.timestamp) {
        fallback.timestamp = new Date().toISOString();
    }

    return fallback;
}


function syncCurrentValuationSnapshot() {
    const aggregates = db.prepare('SELECT SUM(value) AS total_value, SUM(rent) AS rent_roll, AVG(value) AS per_unit_avg FROM units').get();
    const label = String(new Date().getFullYear());
    const totalValue = Math.round(aggregates.total_value || 0);
    const rentRoll = Math.round(aggregates.rent_roll || 0);
    const perUnitAvg = Math.round(aggregates.per_unit_avg || 0);

    db.prepare(`
        INSERT INTO valuation_history (label, total_value, rent_roll, per_unit_avg)
        VALUES (@label, @total_value, @rent_roll, @per_unit_avg)
        ON CONFLICT(label) DO UPDATE SET
            total_value = excluded.total_value,
            rent_roll = excluded.rent_roll,
            per_unit_avg = excluded.per_unit_avg
    `).run({ label, total_value: totalValue, rent_roll: rentRoll, per_unit_avg: perUnitAvg });
}

function getUnits() {
    return db.prepare(`
        SELECT id, unit_code AS unit, floor, type, sqft, status, value, rent, last_sold_at
        FROM units
        ORDER BY floor, unit_code
    `).all();
}

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/units', (req, res) => {
    res.status(200).json(getUnits());
});

app.patch('/api/units/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid unit id' });
    }

    const { status, value, rent } = req.body || {};
    const updates = {};

    if (status !== undefined) {
        if (!['occupied', 'vacant', 'listed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        updates.status = status;
    }

    if (value !== undefined) {
        const parsedValue = Number.parseInt(value, 10);
        if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
            return res.status(400).json({ error: 'Invalid value amount' });
        }
        updates.value = parsedValue;
    }

    if (rent !== undefined) {
        const parsedRent = Number.parseInt(rent, 10);
        if (!Number.isInteger(parsedRent) || parsedRent < 0) {
            return res.status(400).json({ error: 'Invalid rent amount' });
        }
        updates.rent = parsedRent;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided. Use status, value, or rent.' });
    }

    const existing = db.prepare('SELECT id FROM units WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Unit not found' });
    }

    const setClauses = Object.keys(updates).map((key) => `${key} = @${key}`).join(', ');
    db.prepare(`UPDATE units SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

    const updatedUnit = db.prepare(`
        SELECT id, unit_code AS unit, floor, type, sqft, status, value, rent, last_sold_at
        FROM units
        WHERE id = ?
    `).get(id);

    syncCurrentValuationSnapshot();
    return res.status(200).json(updatedUnit);
});

app.get('/api/valuation-history', (req, res) => {
    syncCurrentValuationSnapshot();
    const history = db.prepare(`
        SELECT label, total_value, rent_roll, per_unit_avg
        FROM valuation_history
        ORDER BY label
    `).all();

    res.status(200).json(history);
});

app.get('/api/admin/registrations', async (req, res) => {
    try {
        const registrations = await readRegistrations();
        const normalizedRegistrations = registrations
            .map((entry) => normalizeStoredRegistration(entry))
            .filter(Boolean);
        res.status(200).json(normalizedRegistrations);
    } catch (error) {
        console.error('Error reading registrations:', error);
        res.status(500).json({ error: 'Failed to retrieve registrations' });
    }
});

app.post('/api/register', async (req, res) => {
    const registration = normalizeRegistration(req.body);

    if (!registration) {
        return res.status(400).json({ error: 'Invalid registration payload' });
    }

    try {
        const registrations = await readRegistrations();

        if (hasDuplicateEmail(registrations, registration['Email Address'])) {
            return res.status(409).json({ error: 'A registration with this email already exists' });
        }

        registrations.push(registration);
        await writeRegistrations(registrations);
        return res.status(200).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error('Error saving registration:', error);
        return res.status(500).json({ error: 'Failed to save registration' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;