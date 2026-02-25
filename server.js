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

const DEFAULT_PROPERTIES = [
    ['6035 Pembridge Rd, Knoxville, TN 37912', 490000, 2619, 2345, 3, 3, 10019, 'Single Family', 2015, 'palm-central-private-residences', 249000, '2023-07-03'],
    ['1234 Oak Street, Nashville, TN 37201', 650000, 3200, 2800, 4, 3, 8500, 'Single Family', 2018, 'the-heights-residences', 520000, '2024-02-15'],
    ['5678 Maple Ave, Memphis, TN 38103', 425000, 2100, 1950, 3, 2, 7200, 'Single Family', 2012, 'brilliant-tower', 310000, '2023-11-20']
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

        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL,
            current_value INTEGER NOT NULL,
            estimated_rent INTEGER NOT NULL,
            sqft INTEGER NOT NULL,
            bedrooms INTEGER NOT NULL,
            bathrooms INTEGER NOT NULL,
            lot_size INTEGER NOT NULL,
            property_type TEXT NOT NULL,
            year_built INTEGER NOT NULL,
            project_slug TEXT NOT NULL,
            purchase_price INTEGER,
            last_sold_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS property_price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL,
            price INTEGER NOT NULL,
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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

    const propCount = db.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
    if (propCount === 0) {
        const insertProperty = db.prepare(`
            INSERT INTO properties (address, current_value, estimated_rent, sqft, bedrooms, bathrooms, lot_size, property_type, year_built, project_slug, purchase_price, last_sold_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const entry of DEFAULT_PROPERTIES) {
            insertProperty.run(...entry);
        }

        // Add initial price history for default properties
        const properties = db.prepare('SELECT id, purchase_price, last_sold_at FROM properties').all();
        const insertPriceHistory = db.prepare(`
            INSERT INTO property_price_history (property_id, date, event_type, price)
            VALUES (?, ?, ?, ?)
        `);

        for (const prop of properties) {
            if (prop.last_sold_at && prop.purchase_price) {
                insertPriceHistory.run(prop.id, prop.last_sold_at, 'Sold', prop.purchase_price);
            }
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

// ==================== PROPERTY ENDPOINTS ====================

app.get('/api/properties', (req, res) => {
    const properties = db.prepare(`
        SELECT * FROM properties ORDER BY created_at DESC
    `).all();
    res.status(200).json(properties);
});

app.get('/api/properties/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid property id' });
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }

    const priceHistory = db.prepare(`
        SELECT date, event_type, price 
        FROM property_price_history 
        WHERE property_id = ? 
        ORDER BY date DESC
    `).all(id);

    res.status(200).json({ ...property, price_history: priceHistory });
});

app.post('/api/properties', (req, res) => {
    const {
        address, current_value, estimated_rent, sqft, bedrooms, bathrooms,
        lot_size, property_type, year_built, project_slug, purchase_price, last_sold_at
    } = req.body;

    if (!address || !current_value || !sqft || !bedrooms || !bathrooms || !property_type || !year_built || !project_slug) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
        INSERT INTO properties (
            address, current_value, estimated_rent, sqft, bedrooms, bathrooms,
            lot_size, property_type, year_built, project_slug, purchase_price, last_sold_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        address, current_value, estimated_rent || 0, sqft, bedrooms, bathrooms,
        lot_size || 0, property_type, year_built, project_slug, purchase_price || null, last_sold_at || null
    );

    // Add initial price history if purchase info provided
    if (purchase_price && last_sold_at) {
        db.prepare(`
            INSERT INTO property_price_history (property_id, date, event_type, price)
            VALUES (?, ?, 'Sold', ?)
        `).run(result.lastInsertRowid, last_sold_at, purchase_price);
    }

    const newProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newProperty);
});

app.patch('/api/properties/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid property id' });
    }

    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Property not found' });
    }

    const {
        address, current_value, estimated_rent, sqft, bedrooms, bathrooms,
        lot_size, property_type, year_built, project_slug
    } = req.body;

    const updates = {};
    if (address !== undefined) updates.address = address;
    if (current_value !== undefined) updates.current_value = current_value;
    if (estimated_rent !== undefined) updates.estimated_rent = estimated_rent;
    if (sqft !== undefined) updates.sqft = sqft;
    if (bedrooms !== undefined) updates.bedrooms = bedrooms;
    if (bathrooms !== undefined) updates.bathrooms = bathrooms;
    if (lot_size !== undefined) updates.lot_size = lot_size;
    if (property_type !== undefined) updates.property_type = property_type;
    if (year_built !== undefined) updates.year_built = year_built;
    if (project_slug !== undefined) updates.project_slug = project_slug;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    updates.updated_at = new Date().toISOString();

    const setClauses = Object.keys(updates).map((key) => `${key} = @${key}`).join(', ');
    db.prepare(`UPDATE properties SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

    const updatedProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    res.status(200).json(updatedProperty);
});

app.delete('/api/properties/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid property id' });
    }

    const existing = db.prepare('SELECT id FROM properties WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Property not found' });
    }

    db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    res.status(200).json({ message: 'Property deleted successfully' });
});

// Calculate Zestimate with appreciation
app.post('/api/properties/:id/calculate-zestimate', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid property id' });
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }

    const { appreciation_rate = 7.2 } = req.body; // Default 7.2% per year

    const yearsSincePurchase = property.last_sold_at 
        ? (new Date() - new Date(property.last_sold_at)) / (1000 * 60 * 60 * 24 * 365)
        : 0;

    const basePrice = property.purchase_price || property.current_value;
    const zestimate = Math.round(basePrice * Math.pow(1 + appreciation_rate / 100, yearsSincePurchase));
    
    const rangeMin = Math.round(zestimate * 0.95);
    const rangeMax = Math.round(zestimate * 1.05);

    const pricePerSqft = Math.round(zestimate / property.sqft);
    const estimatedRentYield = property.estimated_rent > 0 
        ? ((property.estimated_rent * 12) / zestimate * 100).toFixed(2)
        : '0.00';

    res.status(200).json({
        property_id: id,
        zestimate,
        range_min: rangeMin,
        range_max: rangeMax,
        price_per_sqft: pricePerSqft,
        estimated_rent: property.estimated_rent,
        rent_yield: estimatedRentYield,
        appreciation_rate,
        years_since_purchase: yearsSincePurchase.toFixed(1),
        purchase_price: basePrice
    });
});

// ==================== EXISTING ENDPOINTS ====================

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
