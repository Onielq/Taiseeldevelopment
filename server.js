const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'registrations.json');
const sseClients = new Set();

function readRegistrations(callback) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return callback(err);
        }

        if (!data) {
            return callback(null, []);
        }

        try {
            const registrations = JSON.parse(data || '[]');
            callback(null, Array.isArray(registrations) ? registrations : []);
        } catch (parseErr) {
            callback(parseErr);
        }
    });
}

function broadcastRegistration(registration) {
    const payload = `data: ${JSON.stringify(registration)}\n\n`;
    sseClients.forEach((client) => client.write(payload));
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(__dirname));

// Endpoint to retrieve registrations for admin
app.get('/api/admin/registrations', (req, res) => {
    readRegistrations((err, registrations) => {
        if (err) {
            console.error('Error reading registration file:', err);
            return res.status(500).json({ error: 'Failed to retrieve registrations' });
        }

        res.status(200).json(registrations);
    });
});

app.get('/api/admin/registrations/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('event: connected\n');
    res.write('data: {"status":"ok"}\n\n');

    sseClients.add(res);

    req.on('close', () => {
        sseClients.delete(res);
    });
});

// Endpoint to handle registrations
app.post('/api/register', (req, res) => {
    const registration = req.body;

    if (!registration.email || !registration.message) {
        return res.status(400).json({ error: 'Email and message are required' });
    }

    // Add timestamp
    registration.timestamp = new Date().toISOString();

    console.log('Received registration:', registration);

    // Read existing registrations
    readRegistrations((err, registrations) => {
        if (err) {
            console.error('Error reading registration file:', err);
            return res.status(500).json({ error: 'Failed to process registration' });
        }

        // Add new registration
        registrations.push(registration);

        // Save back to file
        fs.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error saving registration:', writeErr);
                return res.status(500).json({ error: 'Failed to save registration' });
            }

            broadcastRegistration(registration);
            res.status(200).json({ message: 'Registration successful!' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
