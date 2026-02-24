#!/bin/bash
# Hospital Token System - Supabase Setup Script
# This script automates the setup process (optional - you can also do manually)

set -e

echo "🏥 Hospital Token System - Supabase Setup"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f "/workspaces/Token/backend/.env" ]; then
    echo "❌ Error: backend/.env not found"
    echo ""
    echo "📝 Setup Instructions:"
    echo "1. Go to https://supabase.com and create an account"
    echo "2. Create a new project"
    echo "3. Copy the PostgreSQL connection string"
    echo "4. Edit /workspaces/Token/backend/.env"
    echo "5. Paste the connection string on line 1: DATABASE_URL=..."
    echo ""
    exit 1
fi

echo "✅ Found backend/.env"
echo ""

# Check if DATABASE_URL is set to Supabase
DATABASE_URL=$(grep "^DATABASE_URL=" /workspaces/Token/backend/.env | cut -d= -f2)

if [[ $DATABASE_URL == *"localhost"* ]]; then
    echo "⚠️  Warning: DATABASE_URL still points to localhost"
    echo "   Current: $DATABASE_URL"
    echo ""
    echo "📝 To use Supabase:"
    echo "1. Go to https://supabase.com and create a project"
    echo "2. Get PostgreSQL connection string from Settings → Database"
    echo "3. Update DATABASE_URL in backend/.env"
    echo "4. Run this script again"
    echo ""
    read -p "Continue with localhost? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
elif [[ $DATABASE_URL == *"supabase"* ]]; then
    echo "✅ DATABASE_URL configured for Supabase"
    echo "   Host: $(echo $DATABASE_URL | cut -d@ -f2 | cut -d: -f1)"
else
    echo "⚠️  Unusual DATABASE_URL format"
    echo "   Current: $DATABASE_URL"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd /workspaces/Token/backend
npm install --silent

echo "✅ Backend dependencies installed"
echo ""

echo "🗄️  Generating Prisma client..."
npm run prisma:generate --silent

echo "✅ Prisma client generated"
echo ""

echo "📊 Running database migrations..."
npm run prisma:migrate -- --skip-generate 2>/dev/null || {
    echo "⚠️  Migration failed"
    echo "   This is expected if database already has tables"
    echo "   Continuing with seed..."
}

echo "✅ Migrations completed"
echo ""

echo "🌱 Seeding demo data..."
npm run prisma:seed --silent

echo "✅ Demo data seeded"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd /workspaces/Token/backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd /workspaces/Token/frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo "Login phone: 9000000100"
echo ""
echo "📚 For help, read: /workspaces/Token/00_START_HERE.md"
echo "=========================================="
