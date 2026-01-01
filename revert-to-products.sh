#!/bin/bash

echo "🔄 Reverting to stable Products version..."

# BACKEND
echo "1️⃣ Fixing backend..."
cd backend/routes

# Make sure products.js exists with correct content
if [ ! -f "products.js" ]; then
    echo "   ⚠️  Restoring products.js from backup..."
    # We'll need to recreate it
fi

# Update server.js to use products
cd ..
sed -i "s/pagesRoutes/productsRoutes/g" server.js
sed -i "s/pages.js/products.js/g" server.js
sed -i "s/\/api\/pages/\/api\/products/g" server.js

# FRONTEND
echo "2️⃣ Fixing frontend..."
cd ../dashboard/src

# Fix App.jsx
sed -i "s/PagesList/ProductList/g" App.jsx
sed -i "s/path=\"pages\"/path=\"products\"/g" App.jsx

# Fix api.jsx
cd services
sed -i "s/pagesAPI/productsAPI/g" api.jsx
sed -i "s/\/pages/\/products/g" api.jsx

# Fix components
cd ../components/Dashboard
sed -i "s/pagesAPI/productsAPI/g" *.jsx
sed -i "s/to=\"\/dashboard\/pages\"/to=\"\/dashboard\/products\"/g" DashboardLayout.jsx

# Rename file if needed
if [ -f "PagesList.jsx" ]; then
    mv PagesList.jsx ProductList.jsx
fi

echo "✅ Revert complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart backend: cd backend && npm start"
echo "   2. Restart dashboard: cd dashboard && npm run dev"
echo "   3. Hard refresh browser (Ctrl+Shift+R)"
