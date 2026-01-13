/**
 * PokeRestock Monitor
 * 
 * Monitors Pokemon TCG product restocks at major retailers
 * and sends instant Discord alerts when items become available.
 * 
 * Usage:
 *   1. Add products to monitor in config.js
 *   2. Run: npm start
 *   3. Get Discord alerts when items restock!
 */

// Load environment variables from .env file (for local dev)
// Railway automatically injects env vars, but this helps locally
import 'dotenv/config';

import fetch from 'node-fetch';
import { config, products } from './config.js';

// ============================================================================
// DISCORD ALERT SERVICE
// ============================================================================

async function sendDiscordAlert(product, retailer, price, url) {
  const embed = {
    embeds: [{
      title: `🚨 RESTOCK ALERT: ${product.name}`,
      description: `**${retailer.name}** has this item IN STOCK!`,
      color: 0x00ff00, // Green
      fields: [
        { name: 'Retailer', value: retailer.name, inline: true },
        { name: 'Price', value: price ? `$${price}` : 'Check site', inline: true },
        { name: 'Product', value: product.name, inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'PokeRestock Monitor - ACT FAST!' },
    }],
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 5,
        label: `BUY NOW - ${retailer.name}`,
        url: url,
      }]
    }]
  };

  try {
    const response = await fetch(config.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });
    
    if (response.ok) {
      console.log(`✅ Discord alert sent for ${product.name} at ${retailer.name}`);
      return true;
    } else {
      console.error(`❌ Discord error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send Discord alert:', error.message);
    return false;
  }
}

// ============================================================================
// RETAILER STOCK CHECKERS
// ============================================================================

const retailers = {
  // -------------------------------------------------------------------------
  // WALMART
  // -------------------------------------------------------------------------
  walmart: {
    name: 'Walmart',
    color: '#0071CE',
    
    async checkStock(product) {
      if (!product.walmart) return null;
      
      const url = `https://www.walmart.com/ip/${product.walmart}`;
      
      try {
        // Walmart's API endpoint for product data
        const apiUrl = `https://www.walmart.com/terra-firma/item/${product.walmart}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          // Fallback: try the product page
          const pageResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          
          const html = await pageResponse.text();
          
          // Check for stock indicators in HTML
          const inStock = !html.includes('Out of stock') && 
                         !html.includes('unavailable') &&
                         (html.includes('Add to cart') || html.includes('addToCart'));
          
          return {
            inStock,
            price: null,
            url,
          };
        }
        
        const data = await response.json();
        
        // Parse Walmart's response
        const inStock = data?.product?.availabilityStatus === 'IN_STOCK' ||
                       data?.product?.orderLimit > 0;
        const price = data?.product?.priceInfo?.currentPrice?.price;
        
        return {
          inStock,
          price,
          url,
        };
      } catch (error) {
        console.error(`Walmart check failed for ${product.name}:`, error.message);
        return null;
      }
    },
  },

  // -------------------------------------------------------------------------
  // TARGET
  // -------------------------------------------------------------------------
  target: {
    name: 'Target',
    color: '#CC0000',
    
    async checkStock(product) {
      if (!product.target) return null;
      
      const url = `https://www.target.com/p/-/A-${product.target}`;
      
      try {
        // Target's redsky API for product availability
        const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${product.target}&store_id=1286&scheduled_delivery_store_id=1286`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          return { inStock: false, price: null, url };
        }
        
        const data = await response.json();
        
        // Check various fulfillment options
        const fulfillment = data?.data?.product?.fulfillment;
        const inStock = fulfillment?.shipping_options?.available ||
                       fulfillment?.store_options?.[0]?.in_store_only?.available ||
                       fulfillment?.store_options?.[0]?.order_pickup?.available;
        
        const price = data?.data?.product?.price?.current_retail;
        
        return {
          inStock: !!inStock,
          price,
          url,
        };
      } catch (error) {
        console.error(`Target check failed for ${product.name}:`, error.message);
        return null;
      }
    },
  },

  // -------------------------------------------------------------------------
  // BEST BUY
  // -------------------------------------------------------------------------
  bestbuy: {
    name: 'Best Buy',
    color: '#0046BE',
    
    async checkStock(product) {
      if (!product.bestbuy) return null;
      
      // Best Buy uses alphanumeric product IDs now
      const url = `https://www.bestbuy.com/site/searchpage.jsp?st=${product.bestbuy}`;
      
      try {
        // Try to fetch the product page directly
        const productUrl = `https://www.bestbuy.com/site/-/${product.bestbuy}.p`;
        
        const response = await fetch(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
        });
        
        if (!response.ok) {
          return { inStock: false, price: null, url: productUrl };
        }
        
        const html = await response.text();
        
        // Check for "Add to Cart" button presence
        const inStock = html.includes('Add to Cart') && 
                       !html.includes('Sold Out') &&
                       !html.includes('Coming Soon') &&
                       !html.includes('unavailable');
        
        // Try to extract price
        const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;
        
        return {
          inStock,
          price,
          url: productUrl,
        };
      } catch (error) {
        console.error(`Best Buy check failed for ${product.name}:`, error.message);
        return null;
      }
    },
  },

  // -------------------------------------------------------------------------
  // POKEMON CENTER
  // -------------------------------------------------------------------------
  pokemoncenter: {
    name: 'Pokemon Center',
    color: '#FFCB05',
    
    async checkStock(product) {
      if (!product.pokemoncenter) return null;
      
      const url = `https://www.pokemoncenter.com/product/${product.pokemoncenter}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        const html = await response.text();
        
        // Check for stock indicators
        const inStock = html.includes('Add to Bag') && 
                       !html.includes('Out of Stock') &&
                       !html.includes('Sold Out');
        
        // Try to extract price
        const priceMatch = html.match(/\$(\d+\.\d{2})/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;
        
        return {
          inStock,
          price,
          url,
        };
      } catch (error) {
        console.error(`Pokemon Center check failed for ${product.name}:`, error.message);
        return null;
      }
    },
  },

  // -------------------------------------------------------------------------
  // GAMESTOP
  // -------------------------------------------------------------------------
  gamestop: {
    name: 'GameStop',
    color: '#ED1C24',
    
    async checkStock(product) {
      if (!product.gamestop) return null;
      
      const url = `https://www.gamestop.com/products/${product.gamestop}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        const html = await response.text();
        
        const inStock = html.includes('Add to Cart') && 
                       !html.includes('Not Available') &&
                       !html.includes('Out of Stock');
        
        const priceMatch = html.match(/\$(\d+\.\d{2})/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;
        
        return {
          inStock,
          price,
          url,
        };
      } catch (error) {
        console.error(`GameStop check failed for ${product.name}:`, error.message);
        return null;
      }
    },
  },
};

// ============================================================================
// STOCK TRACKING STATE
// ============================================================================

// Track what was in stock last check (to avoid duplicate alerts)
const stockState = new Map();

function getStateKey(product, retailerKey) {
  return `${product.name}-${retailerKey}`;
}

// ============================================================================
// MAIN MONITOR LOOP
// ============================================================================

async function checkAllProducts() {
  console.log(`\n🔍 Checking stock at ${new Date().toLocaleTimeString()}...`);
  
  // Check all products in parallel for speed
  const checks = [];
  
  for (const product of products) {
    for (const [retailerKey, retailer] of Object.entries(retailers)) {
      // Skip if product doesn't have this retailer's SKU
      if (!product[retailerKey]) continue;
      
      checks.push({
        product,
        retailerKey,
        retailer,
        promise: retailer.checkStock(product),
      });
    }
  }
  
  // Wait for all checks to complete
  const results = await Promise.allSettled(checks.map(c => c.promise));
  
  // Process results
  for (let i = 0; i < checks.length; i++) {
    const { product, retailerKey, retailer } = checks[i];
    const result = results[i];
    
    if (result.status === 'rejected' || !result.value) {
      console.log(`⚠ Check failed: ${product.name} at ${retailer.name}`);
      continue;
    }
    
    const stockResult = result.value;
    const stateKey = getStateKey(product, retailerKey);
    const wasInStock = stockState.get(stateKey) || false;
    
    if (stockResult.inStock && !wasInStock) {
      // NEW RESTOCK! Send alert!
      console.log(`🚨 RESTOCK: ${product.name} at ${retailer.name}!`);
      await sendDiscordAlert(product, retailer, stockResult.price, stockResult.url);
    } else if (stockResult.inStock) {
      console.log(`✓ In stock: ${product.name} at ${retailer.name}`);
    } else {
      console.log(`✗ Out of stock: ${product.name} at ${retailer.name}`);
    }
    
    // Update state
    stockState.set(stateKey, stockResult.inStock);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startMonitor() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎴 PokeRestock Monitor Started!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Monitoring ${products.length} products`);
  console.log(`  Check interval: ${config.checkInterval / 1000} seconds`);
  console.log(`  Discord webhook: ${config.discordWebhook ? 'Configured ✓' : 'NOT SET ✗'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!config.discordWebhook) {
    console.error('❌ ERROR: Discord webhook not configured in config.js!');
    process.exit(1);
  }
  
  if (products.length === 0) {
    console.error('❌ ERROR: No products configured in config.js!');
    process.exit(1);
  }
  
  // Initial check
  await checkAllProducts();
  
  // Start monitoring loop
  setInterval(checkAllProducts, config.checkInterval);
  
  console.log('\n👀 Monitor running! Press Ctrl+C to stop.\n');
}

// Start the monitor
startMonitor();
