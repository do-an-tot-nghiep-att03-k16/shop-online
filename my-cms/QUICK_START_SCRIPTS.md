# 🚀 Quick Start - CMS Scripts

## ⚡ TL;DR

```bash
cd my-cms
cp .env.example .env
# Edit .env với actual values
npm run test:backend
npm run test:strapi
npm run sync:all
```

---

## 📋 Available Commands

### 🔄 Sync Data
```bash
npm run sync:all           # Sync tất cả (categories + coupons)
npm run sync:categories    # Chỉ sync categories
npm run sync:coupons       # Chỉ sync coupons
```

### 🧪 Testing
```bash
npm run test:backend       # Test backend API connection
npm run test:strapi        # Test Strapi connection
```

### ⏰ Scheduler
```bash
npm run sync-scheduler     # Auto sync every 2 hours
npm run sync-scheduler-now # Auto sync + sync immediately
```

### 🔍 Debug
```bash
node scripts/debug-backend-response.js  # Debug API response format
```

---

## 🔑 Required Environment Variables

```bash
# my-cms/.env
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your-backend-api-key      # ⚠️ Required!
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-token        # ⚠️ Required!
```

**Where to get:**
- `BACKEND_API_KEY`: From your backend API (check apikey.model.js)
- `STRAPI_API_TOKEN`: Strapi Admin → Settings → API Tokens → Create

---

## 🛠️ Troubleshooting

### ❌ "Thiếu BACKEND_API_KEY"
→ Add `BACKEND_API_KEY` to `.env` file

### ❌ "Thiếu STRAPI_API_TOKEN"  
→ Create API token in Strapi Admin panel

### ❌ "Backend connection failed"
→ Check if backend server is running on port 3000

### ❌ "Strapi connection failed"
→ Check if Strapi is running on port 1337

### ❌ "404 Content type not found"
→ Create Categories and Coupons content types in Strapi first

---

## 📚 Full Documentation

For detailed setup instructions, see:
- `SYNC_SETUP_GUIDE.md` - Complete setup guide
- `../SCRIPTS_FOLDER_CLEANUP_SUMMARY.md` - Architecture decisions

---

**⚠️ Important:** Always run commands from `my-cms/` directory!
