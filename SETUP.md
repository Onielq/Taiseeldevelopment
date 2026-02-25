# 🏢 Taiseel Real Estate - Complete Setup Guide

## ✅ What You Have

Your Taiseel website is now **fully connected** to the SQLite database!

### Files Included:
```
taiseel.db                      # Database with 20 units + valuation history
server.js                       # Backend API server
taiseel-db-integration.js       # Frontend integration script
package.json                    # Node.js dependencies
palm-central-private-residences.html  # Your existing HTML page
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

You should see:
```
============================================================
   🏢 TAISEEL REAL ESTATE SERVER
============================================================

✅ Server running at http://localhost:3000
📊 API endpoints available:
   GET  /api/health
   GET  /api/units
   GET  /api/stats
   ...

🌐 Open http://localhost:3000/palm-central-private-residences.html
```

### Step 3: Add Integration Script to Your HTML

Add this line to your HTML file **before the closing `</body>` tag**:

```html
<!-- Add this BEFORE the closing </body> tag -->
<script src="taiseel-db-integration.js"></script>
</body>
</html>
```

**That's it!** Your website now displays **REAL data from the database**! 🎉

---

## 📊 What Gets Updated Automatically

When you open the page, the integration script automatically updates:

### ✅ Building Snapshot
- Total building value
- Number of units
- Occupancy percentage
- Monthly rent roll

### ✅ Value Cards
- Building Zestimate (total value)
- Per unit average
- Monthly rent roll

### ✅ Occupancy Strip
- Occupied count
- Vacant count
- Listed count
- Occupancy percentage bar

### ✅ Units Table
- All 20 units from database
- Real-time status (occupied/vacant/listed)
- Actual values and rents
- Rental yields calculated

### ✅ Valuation Chart
- Historical data from 2019-2025
- Total building value
- Rent roll trends
- Per-unit averages

---

## 🔌 API Endpoints

Your server provides these endpoints:

### Get All Units
```bash
GET http://localhost:3000/api/units
```
Returns all 20 units with complete details.

### Get Building Statistics
```bash
GET http://localhost:3000/api/stats
```
Returns:
- Total units, occupied, vacant, listed
- Total building value
- Rent roll
- Occupancy rate
- Gross yield

### Get Valuation History
```bash
GET http://localhost:3000/api/valuation-history
```
Returns 7 years of historical data (2019-2025).

### Get Units by Status
```bash
GET http://localhost:3000/api/units/status/vacant
GET http://localhost:3000/api/units/status/occupied
GET http://localhost:3000/api/units/status/listed
```

### Get Units by Floor
```bash
GET http://localhost:3000/api/units/floor/3
```

### Submit Inquiry
```bash
POST http://localhost:3000/api/inquiries
Content-Type: application/json

{
  "unit_id": 4,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in Unit 104"
}
```

### Submit Registration
```bash
POST http://localhost:3000/api/register
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "country": "US",
  "bedrooms": "2",
  "timeline": "3mo",
  "purpose": "Investment"
}
```

---

## 🧪 Testing

### Test the API
```bash
# Health check
curl http://localhost:3000/api/health

# Get all units
curl http://localhost:3000/api/units

# Get statistics
curl http://localhost:3000/api/stats

# Get vacant units
curl http://localhost:3000/api/units/status/vacant
```

### Test in Browser Console
Open your browser console (F12) and run:
```javascript
// Fetch all units
TaiseelDB.fetchUnits().then(units => console.log(units));

// Fetch stats
TaiseelDB.fetchStats().then(stats => console.log(stats));

// Reload all data
TaiseelDB.updateBuildingSnapshot();
TaiseelDB.loadUnitsTable();
```

---

## 📝 How It Works

### 1. Database → API (server.js)
The server reads from `taiseel.db` and exposes the data via REST API endpoints.

### 2. API → Frontend (taiseel-db-integration.js)
The integration script fetches data from the API when the page loads.

### 3. Frontend → UI
The script updates the HTML elements with real database data.

### Data Flow:
```
taiseel.db → server.js → API → taiseel-db-integration.js → HTML page
```

---

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is busy, change it in `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change to 3001
```

### CORS Errors
Make sure the server is running and the integration script uses the correct URL:
```javascript
const API_BASE = 'http://localhost:3000/api';
```

### Data Not Loading
1. Check browser console (F12) for errors
2. Verify server is running: `curl http://localhost:3000/api/health`
3. Make sure `taiseel-db-integration.js` is loaded in your HTML

### Database Locked
If you get "database is locked" errors:
1. Close any SQLite viewers
2. Restart the server

---

## 🎨 Customization

### Update Unit Data
```bash
# Use SQLite command line
sqlite3 taiseel.db

# Or Python
python3 -c "
import sqlite3
conn = sqlite3.connect('taiseel.db')
conn.execute('UPDATE units SET status = ? WHERE unit_code = ?', ('vacant', '302'))
conn.commit()
"
```

### Add New Units
```sql
INSERT INTO units (unit_code, floor, type, sqft, status, value, rent, last_sold_at)
VALUES ('701', 7, 'Penthouse', 2800, 'listed', 3200000, 9500, '2026-02-22');
```

### Update Valuation History
```sql
INSERT INTO valuation_history (label, total_value, rent_roll, per_unit_avg)
VALUES ('2026', 26500000, 72800, 1325000);
```

---

## 📱 Production Deployment

For production, you'll need to:

1. **Use a proper database** (PostgreSQL, MySQL) instead of SQLite
2. **Add authentication** for admin endpoints
3. **Set up HTTPS** with SSL certificates
4. **Deploy to a hosting service** (Heroku, DigitalOcean, AWS)
5. **Add environment variables** for configuration
6. **Implement rate limiting** to prevent abuse

---

## 🆘 Need Help?

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

### View Database
```bash
sqlite3 taiseel.db "SELECT * FROM units LIMIT 5"
```

### Check Logs
The server logs all API requests and database operations to the console.

---

## ✨ Success Checklist

- [x] Database created with 20 units
- [x] Backend API server running
- [x] Integration script connecting frontend to backend
- [x] HTML page displaying real data
- [x] All endpoints tested and working

**Your website is now fully connected to the database!** 🎉
