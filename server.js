const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'registrations.json');

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

    cleaned['Email Address'] = email;
    delete cleaned.Email;
    cleaned.timestamp = new Date().toISOString();

    return cleaned;
}

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/admin/registrations', async (req, res) => {
    try {
        const registrations = await readRegistrations();
        res.status(200).json(registrations);
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