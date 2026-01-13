# 🎴 PokeRestock Monitor

Instant Discord alerts when Pokemon TCG products restock at major retailers.

## Features

- Monitors: **Walmart**, **Target**, **Best Buy**, **Pokemon Center**, **GameStop**
- Checks every 30 seconds (configurable)
- Instant Discord notifications with buy links
- **Private SKUs** - Your product IDs stay secret via environment variables

---

## Quick Start (Local)

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) (version 20+)

### 2. Install Dependencies
```bash
cd PokeRestockMonitor
npm install
```

### 3. Set Up Your Private Config
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your real webhook and SKUs
```

### 4. Run the Monitor
```bash
npm start
```

---

## Privacy: Public Code, Private SKUs

This repo is safe to make public! Your actual SKUs and webhook are stored in:
- **Local**: `.env` file (git-ignored, never uploaded)
- **Railway**: Environment variables (set in dashboard)

The public code only shows empty placeholder products.

---

## Finding SKUs for Ascended Heroes

When the products are listed on retailer websites:

### Walmart
1. Search "Pokemon Ascended Heroes"
2. Click the product
3. URL: `walmart.com/ip/Pokemon-Ascended-Heroes/XXXXXXXXX`
4. Copy the number at the end

### Target  
1. Search "Pokemon Ascended Heroes"
2. Click the product
3. URL: `target.com/p/.../-/A-XXXXXXXX`
4. Copy the number after `A-`

### Best Buy
1. Search "Pokemon Ascended Heroes"
2. Click the product
3. URL: `bestbuy.com/site/.../XXXXXXX.p`
4. Copy the number before `.p`

---

## Deploy to Railway (Free 24/7)

### 1. Push to GitHub (public repo is fine!)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/PokeRestockMonitor.git
git push -u origin main
```

### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your PokeRestockMonitor repo

### 3. Add Environment Variables (IMPORTANT!)
1. Click on your deployed service
2. Go to **Variables** tab
3. Add these variables:

| Variable | Value |
|----------|-------|
| `DISCORD_WEBHOOK` | `https://discord.com/api/webhooks/...` |
| `PRODUCTS` | `[{"name":"Ascended Heroes ETB","walmart":"123","target":"456"}]` |
| `CHECK_INTERVAL` | `30000` |

### 4. Done!
Railway redeploys automatically with your private config.

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_WEBHOOK` | Your Discord webhook URL | `https://discord.com/api/webhooks/...` |
| `CHECK_INTERVAL` | Ms between checks (default 30000) | `30000` |
| `PRODUCTS` | JSON array of products | See below |

### PRODUCTS Format
```json
[
  {
    "name": "Ascended Heroes ETB",
    "walmart": "123456789",
    "target": "12345678",
    "bestbuy": "6543210",
    "pokemoncenter": "",
    "gamestop": ""
  }
]
```

---

## Tips

1. **Products aren't listed yet?** - Keep the SKUs empty for now, add them when retailers list the products
2. **Hot drops** - For release day, set `CHECK_INTERVAL=15000` (15 seconds)
3. **Phone notifications** - Enable Discord notifications for the alert channel
4. **Act fast** - Giga products sell out in 15-30 seconds!

---

## Troubleshooting

### "Discord webhook not configured"
Set the `DISCORD_WEBHOOK` environment variable

### "No products configured"  
Set the `PRODUCTS` environment variable with at least one product that has a SKU

### Monitor not finding products
Make sure your SKUs are correct - double check the retailer URLs

---

Made with ❤️ for Pokemon collectors
