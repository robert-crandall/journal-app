#!/usr/bin/env bash

# Journal App Backend Setup Script

echo "🚀 Setting up Journal App Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual database credentials and API keys!"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Set up PostgreSQL database"
echo "3. Run migrations: bun run db:migrate"
echo "4. Start development server: bun run dev"
echo ""
echo "🔗 API Endpoints will be available at:"
echo "   • Auth: http://localhost:3001/api/auth"
echo "   • Journal: http://localhost:3001/api/journal"
