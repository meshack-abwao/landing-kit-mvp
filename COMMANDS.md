# Common Commands Reference

## Development

### Start Backend Server
```bash
cd backend
npm run dev
```

### Test Backend Health
```bash
curl http://localhost:3000/health
```

### View Backend Logs
```bash
cd backend
tail -f *.log
```

### Test Frontend
```bash
cd frontend
open index.html
# Or drag index.html to browser
```

## Git Workflow

### Save Your Work
```bash
git add .
git commit -m "Description of changes"
```

### View Changes
```bash
git status
git diff
```

### View History
```bash
git log --oneline
```

## Testing

### Test API Endpoint
```bash
# Health check
curl http://localhost:3000/health

# Create order (replace with actual data)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Product",
    "quantity": 1,
    "price": 2500,
    "total": 2500,
    "customer": {
      "name": "Test Customer",
      "phone": "254712345678",
      "location": "Nairobi"
    },
    "paymentMethod": "cod"
  }'
```

## Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules
npm install
npm run dev
```

### Port already in use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process (replace PID with actual number)
kill -9 PID
```

### Environment variables not loading
```bash
cd backend
cat .env  # Verify file exists and has values
```

## Deployment

### Deploy Frontend to Netlify
```bash
cd frontend
netlify deploy --prod
```

### Deploy Backend to Heroku
```bash
cd backend
git push heroku main
heroku logs --tail
```
"quantity": 1,
    "price": 2500,
    "total": 2500,
    "customer": {
      "name": "Test Customer",
      "phone": "254712345678",
      "location": "Nairobi"
    },
    "paymentMethod": "cod"
  }'
```
[200~## Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules
npm install
npm run dev
```

### Port already in use
```bash
# Find process on port 3000
lsof -i :3000

# Kill process (replace PID with actual number)
kill -9 PID
```

### Environment variables not loading
```bash
cd backend
cat .env  # Verify file exists and has values
```

## Deployment

### Deploy Frontend to Netlify
```bash
cd frontend
netlify deploy --prod
```

### Deploy Backend to Heroku
```bash
cd backend
git push heroku main
heroku logs --tail
```~
