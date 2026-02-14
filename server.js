const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'registrations.json');

function readRegistrations(callback) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return callback(null, []);
            }
            return callback(err);
        }

        if (!data.trim()) {
            return callback(null, []);
        }

        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                return callback(new Error('Invalid registrations payload format'));
            }
            return callback(null, parsed);
        } catch (parseErr) {
            return callback(parseErr);
        }
    });
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

        return res.status(200).json(registrations);
    });
});

// Endpoint to handle registrations
app.post('/api/register', (req, res) => {
    const registration = req.body;

    if (!registration || typeof registration !== 'object' || Array.isArray(registration)) {
        return res.status(400).json({ error: 'Invalid payload' });
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

            res.status(200).json({ message: 'Registration successful!' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});