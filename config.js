/**
 * PokeRestock Monitor Configuration
 * 
 * PUBLIC VERSION - SKUs are loaded from environment variables
 * This keeps your actual SKUs private while the code is public.
 * 
 * For local testing: Create a .env file (not tracked by git)
 * For Railway: Add environment variables in the dashboard
 */

// ============================================================================
// MAIN CONFIGURATION
// ============================================================================

export const config = {
  // Discord webhook - set via environment variable for privacy
  discordWebhook: process.env.DISCORD_WEBHOOK || '',
  
  // How often to check stock (in milliseconds)
  // 30000 = 30 seconds (recommended minimum)
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30000,
};

// ============================================================================
// PRODUCTS TO MONITOR
// ============================================================================
// 
// Products are loaded from the PRODUCTS environment variable (JSON string)
// This keeps your SKUs private!
//
// Example PRODUCTS env var:
// [{"name":"Ascended Heroes ETB","walmart":"123456","target":"789012"}]
//
// ============================================================================

function loadProducts() {
  // Try to load from environment variable first (for Railway/production)
  if (process.env.PRODUCTS) {
    try {
      return JSON.parse(process.env.PRODUCTS);
    } catch (e) {
      console.error('Failed to parse PRODUCTS env var:', e.message);
    }
  }
  
  // Fallback to demo products (empty SKUs for public repo)
  // These are placeholder examples - real SKUs go in .env or Railway variables
  return [
    {
      name: 'Ascended Heroes Elite Trainer Box',
      walmart: '',      // Real SKU: 18710966734
      target: '',       // Not yet available
      bestbuy: '',      // Real SKU: JJG2TLXSFV
      pokemoncenter: '',// Real SKU: 10-10315-108
      gamestop: '',     // Real SKU: 20030564
    },
    {
      name: 'Ascended Heroes Booster Bundle (6 packs)',
      walmart: '',      // Real SKU: 18728422476
      target: '',
      bestbuy: '',      // Real SKU: JJG2TL3JP8
      pokemoncenter: '',
      gamestop: '',
    },
    {
      name: 'Ascended Heroes Premium Poster Collection',
      walmart: '',
      target: '',
      bestbuy: '',      // Real SKU: JJG2TL3JG6
      pokemoncenter: '',
      gamestop: '',
    },
    {
      name: 'Ascended Heroes 2-Pack Blister',
      walmart: '',      // Real SKU: 18911118976
      target: '',
      bestbuy: '',      // Real SKU: JJG2TLXP48
      pokemoncenter: '',
      gamestop: '',
    },
  ];
}

export const products = loadProducts();

// ============================================================================
// HOW TO SET UP ENVIRONMENT VARIABLES
// ============================================================================
//
// OPTION 1: Local .env file (for testing on your computer)
// Create a file called ".env" in this folder with:
//
//   DISCORD_WEBHOOK=https://discord.com/api/webhooks/your-webhook-here
//   PRODUCTS=[{"name":"Ascended Heroes ETB","walmart":"12345","target":"67890"}]
//
// OPTION 2: Railway Dashboard (for production)
// 1. Go to your Railway project
// 2. Click on your service
// 3. Go to "Variables" tab
// 4. Add:
//    - DISCORD_WEBHOOK = your webhook URL
//    - PRODUCTS = your JSON array of products
//
// ============================================================================
