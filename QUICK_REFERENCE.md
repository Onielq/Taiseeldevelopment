# Taiseel Development - Quick Reference Card

## 🚀 Getting Started (5 Minutes)

### 1. Setup
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Configure
```bash
nano .env  # Update database credentials
```

### 3. Start
```bash
npm run dev
```

### 4. Access
- Website: http://localhost:5000
- Admin Login: http://localhost:5000/admin-login.html
- Admin Email: admin@taiseeldevelopment.rw

---

## 📋 Implementation Checklist

### Critical Path (Must Do First)
- [ ] Day 1-2: Authentication (4-6 hours)
- [ ] Day 3-4: Database Migration (6-8 hours)
- [ ] Day 5: Input Validation (3-4 hours)
- [ ] Day 6: Security Hardening (4-5 hours)

**Total: 20-25 hours → Gets you from 6.0 to 8.5**

### Optional Enhancements
- [ ] Day 7: Analytics (3-4 hours)
- [ ] Day 8: Code Refactoring (5-6 hours)
- [ ] Day 9: Monitoring & Logging (3-4 hours)
- [ ] Day 10: Testing & Release (4-5 hours)

**Total: 35-42 hours → Gets you to 9.5**

---

## 🔑 Essential Commands

### Development
```bash
npm run dev          # Start with auto-reload
npm start            # Production start
npm test             # Run tests
npm run lint         # Check code quality
```

### Database
```bash
npm run migrate      # Migrate JSON to DB
npm run db:setup     # Create schema
```

### Security
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('password', 10, (e,h) => console.log(h))"
```

### Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com",...}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taiseeldevelopment.rw","password":"your_password"}'

# Test protected route
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/admin/registrations
```

---

## 📂 File Locations

### Configuration
- `.env` - Environment variables
- `package.json` - Dependencies
- `.gitignore` - Ignored files

### Implementation Code
- `day1-2-auth/` - Authentication files
- `day3-4-database/` - Database setup
- `day5-validation/` - Input validation
- `day6-security/` - Security middleware

### Documentation
- `README.md` - Project overview
- `IMPLEMENTATION_ROADMAP.md` - High-level plan
- `IMPLEMENTATION_GUIDE.md` - Step-by-step
- `EXECUTIVE_SUMMARY.md` - Overview

---

## ⚠️ Common Issues & Fixes

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
cat .env | grep DB_

# Test connection
psql -U taiseel_user -d taiseel_development
```

### Authentication Not Working
```bash
# Check JWT_SECRET is set
cat .env | grep JWT_SECRET

# Verify password hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.compareSync('your_password', 'hash_from_env'))"

# Clear browser cache and cookies
```

### Rate Limiting Too Strict
```bash
# Add your IP to trusted list
# Edit .env: TRUSTED_IPS=127.0.0.1,your.ip.address

# Or temporarily disable for testing
# Comment out rate limiter in server.js
```

### Migration Failed
```bash
# Backup original data
cp registrations.json registrations.json.backup

# Check database is empty
psql -U taiseel_user -d taiseel_development -c "SELECT COUNT(*) FROM registrations;"

# Re-run migration
node day3-4-database/migrate-json-to-db.js
```

---

## 🎯 Priority Matrix

| Priority | Task | Impact | Time | Risk |
|----------|------|--------|------|------|
| P0 | Authentication | +1.5 | 4-6h | HIGH |
| P0 | Database | +1.5 | 6-8h | HIGH |
| P1 | Validation | +1.0 | 3-4h | MED |
| P1 | Security | +1.0 | 4-5h | HIGH |
| P2 | Analytics | +0.6 | 3-4h | LOW |
| P2 | Refactor | +0.6 | 5-6h | LOW |
| P1 | Monitoring | +0.5 | 3-4h | MED |
| P1 | Testing | +0.7 | 4-5h | MED |

---

## 📊 Score Tracker

Track your progress:

- [ ] **6.0** - Starting point (current state)
- [ ] **7.5** - After Authentication (Day 1-2)
- [ ] **8.5** - After Database (Day 3-4)
- [ ] **9.0** - After Validation (Day 5)
- [ ] **9.3** - After Security (Day 6)
- [ ] **9.5** - After All Days (Day 10)

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Enable DB_SSL=true
- [ ] Update ALLOWED_ORIGINS to production domains
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure automated backups
- [ ] Set up error monitoring
- [ ] Review and test rate limits
- [ ] Verify security headers present

---

## 📞 Quick Help

### Stuck? Check These First
1. **Read error message carefully** - Often tells you exactly what's wrong
2. **Check logs** - `logs/application-[date].log`
3. **Verify .env** - All required variables set?
4. **Database running?** - `sudo systemctl status postgresql`
5. **Dependencies installed?** - `npm install`

### Documentation
- Start here: `README.md`
- Roadmap: `IMPLEMENTATION_ROADMAP.md`
- Detailed guide: `IMPLEMENTATION_GUIDE.md`
- Overview: `EXECUTIVE_SUMMARY.md`

### Testing Each Component
```bash
# Test database
psql -U taiseel_user -d taiseel_development -c "SELECT 1;"

# Test authentication
curl http://localhost:5000/api/auth/verify

# Test health
curl http://localhost:5000/api/health

# Test registration
npm test
```

---

## ⏱️ Time Estimates

### Minimum Viable (Critical Only)
- **Total Time:** 20-25 hours
- **Days:** 1-6 (critical path)
- **Score:** 6.0 → 8.5
- **Status:** Production-safe

### Complete Implementation
- **Total Time:** 35-42 hours
- **Days:** 1-10 (full package)
- **Score:** 6.0 → 9.5
- **Status:** Production-ready

### Daily Breakdown
| Day | Hours | Cumulative |
|-----|-------|------------|
| 1-2 | 4-6   | 4-6        |
| 3-4 | 6-8   | 10-14      |
| 5   | 3-4   | 13-18      |
| 6   | 4-5   | 17-23      |
| 7   | 3-4   | 20-27      |
| 8   | 5-6   | 25-33      |
| 9   | 3-4   | 28-37      |
| 10  | 4-5   | 32-42      |

---

## 🚦 Status Indicators

### System Health
```bash
# Check all components
npm test                          # Tests
curl http://localhost:5000/health # API
psql -U user -d db -c "SELECT 1;" # Database
```

### Expected Results
- ✅ Tests: All passing
- ✅ Health: Status 200, `"status":"ok"`
- ✅ Database: Returns `1`

---

## 📦 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit complete
- [ ] .env configured for production
- [ ] Database backed up
- [ ] SSL certificates ready

### Deployment
- [ ] Deploy code
- [ ] Run migrations
- [ ] Verify health endpoint
- [ ] Test critical flows
- [ ] Monitor logs

### Post-Deployment
- [ ] Verify admin login works
- [ ] Test registration flow
- [ ] Check monitoring dashboards
- [ ] Review error logs
- [ ] Update documentation

---

## 🎓 Learning Resources

### Package Documentation
- Each `SKILL.md` contains best practices
- Code examples in each day's folder
- Comments explain complex logic

### External Resources
- Node.js: https://nodejs.org/docs
- PostgreSQL: https://postgresql.org/docs
- Express: https://expressjs.com
- JWT: https://jwt.io

---

**Need more details? See IMPLEMENTATION_GUIDE.md**

**Questions? Check troubleshooting in README.md**

**Ready to start? Run: `./setup.sh`**
