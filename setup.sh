#!/bin/bash

# Flows App Template Setup Script
# This script helps you customize the template for your new app

set -e

echo "🚀 Flows App Template Setup"
echo "=========================="

# Get app details from user
read -p "Enter your app name (e.g., 'Slack Integration'): " APP_NAME
read -p "Enter app description: " APP_DESCRIPTION

if [[ -z "$APP_NAME" || -z "$APP_DESCRIPTION" ]]; then
    echo "❌ App name and description are required"
    exit 1
fi

echo ""
echo "📝 Customizing template..."

# Replace placeholders in files
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/{{APP_NAME}}/$APP_NAME/g" package.json main.ts types.ts README.md
    sed -i '' "s/{{APP_DESCRIPTION}}/$APP_DESCRIPTION/g" package.json main.ts types.ts README.md
else
    # Linux
    sed -i "s/{{APP_NAME}}/$APP_NAME/g" package.json main.ts types.ts README.md
    sed -i "s/{{APP_DESCRIPTION}}/$APP_DESCRIPTION/g" package.json main.ts types.ts README.md
fi

echo "✅ Placeholders replaced"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🔍 Running initial validation..."
npm run typecheck

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Customize your app logic in main.ts"
echo "2. Update configuration schema if needed"
echo "3. Test with: npm run typecheck && npm run bundle"
echo "4. Commit your changes and create your first release"
echo ""
echo "📚 See README.md for detailed customization guide"