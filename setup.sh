#!/bin/bash
# Taiseel Development - Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "========================================="
echo "Taiseel Development - Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js detected: $(node --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL not detected${NC}"
    echo "Please install PostgreSQL 13+ for database functionality"
    echo "Installation guides:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt install postgresql"
    echo "  - Windows: https://www.postgresql.org/download/windows/"
    echo ""
    read -p "Continue without PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ PostgreSQL detected${NC}"
fi

# Create directory structure
echo ""
echo "Creating directory structure..."
mkdir -p config middleware routes models utils scripts logs backups
mkdir -p public/css public/js public/images
echo -e "${GREEN}✓ Directories created${NC}"

# Install dependencies
echo ""
echo "Installing dependencies (this may take a few minutes)..."
npm install --silent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env file
    sed -i.bak "s/your_jwt_secret_key_here_minimum_32_characters/$JWT_SECRET/" .env
    sed -i.bak "s/your_session_secret_here_minimum_32_characters/$SESSION_SECRET/" .env
    rm .env.bak
    
    echo -e "${GREEN}✓ .env file created with generated secrets${NC}"
    echo -e "${YELLOW}⚠ Please update database credentials in .env${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
fi

# Generate admin password hash
echo ""
echo "Generating admin password..."
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""
ADMIN_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10, (e,h) => console.log(h))")
echo "ADMIN_PASSWORD_HASH=$ADMIN_HASH" >> .env
echo -e "${GREEN}✓ Admin password hash added to .env${NC}"

# Backup existing files
echo ""
echo "Creating backups of existing files..."
[ -f server.js ] && cp server.js server.js.backup
[ -f index.html ] && cp index.html index.html.backup
[ -f admin.html ] && cp admin.html admin.html.backup
[ -f registrations.json ] && cp registrations.json registrations.json.backup
echo -e "${GREEN}✓ Backups created${NC}"

# Database setup (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    echo ""
    read -p "Would you like to set up the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Setting up database..."
        read -p "Enter PostgreSQL username (default: postgres): " DB_USER
        DB_USER=${DB_USER:-postgres}
        
        read -sp "Enter PostgreSQL password: " DB_PASSWORD
        echo ""
        
        # Create database
        PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -c "CREATE DATABASE taiseel_development;" 2>/dev/null || echo "Database may already exist"
        
        # Update .env
        sed -i.bak "s/DB_USER=postgres/DB_USER=$DB_USER/" .env
        sed -i.bak "s/DB_PASSWORD=your_secure_password_here/DB_PASSWORD=$DB_PASSWORD/" .env
        rm .env.bak
        
        # Run schema
        PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d taiseel_development -f day3-4-database/schema.sql
        
        echo -e "${GREEN}✓ Database setup complete${NC}"
    fi
fi

# Create essential files if they don't exist
echo ""
echo "Setting up essential files..."

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
logs/
backups/
*.backup
.DS_Store
registrations.json
*.sql
coverage/
EOF

echo -e "${GREEN}✓ .gitignore created${NC}"

# Print next steps
echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Review and update .env file with your configurations:"
echo "   - Database credentials"
echo "   - Production URLs"
echo "   - SMTP settings (optional)"
echo ""
echo "2. Start the development server:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Access the application:"
echo "   - Website: http://localhost:5000"
echo "   - Admin Login: http://localhost:5000/admin-login.html"
echo "   - Admin Email: admin@taiseeldevelopment.rw"
echo "   - Admin Password: (the password you just set)"
echo ""
echo "4. Follow the Implementation Guide:"
echo "   ${YELLOW}cat IMPLEMENTATION_GUIDE.md${NC}"
echo ""
echo "5. Run tests:"
echo "   ${YELLOW}npm test${NC}"
echo ""
echo "For detailed instructions, see:"
echo "  - IMPLEMENTATION_GUIDE.md"
echo "  - IMPLEMENTATION_ROADMAP.md"
echo ""
echo "Need help? Check the troubleshooting section in the implementation guide."
echo ""
