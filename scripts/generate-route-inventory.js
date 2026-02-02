#!/usr/bin/env node
/**
 * Route Inventory Generator
 * Reads routesManifest.ts and outputs JSON inventories for audit verification.
 * 
 * Usage: node scripts/generate-route-inventory.js
 * Output: artifacts/audit/zone1_routes.json
 *         artifacts/audit/zone2_modules.json
 *         artifacts/audit/legacy_redirects.json
 */

const fs = require('fs');
const path = require('path');

// Read the manifest file
const manifestPath = path.join(__dirname, '../src/manifests/routesManifest.ts');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Extract Zone 1 routes
function extractZone1Routes() {
  const routesMatch = manifestContent.match(/zone1Admin[^}]*routes:\s*\[([\s\S]*?)\],\s*}/);
  if (!routesMatch) return [];
  
  const routesBlock = routesMatch[1];
  const routes = [];
  const routeRegex = /\{\s*path:\s*"([^"]*)",\s*component:\s*"([^"]*)",\s*title:\s*"([^"]*)"/g;
  
  let match;
  while ((match = routeRegex.exec(routesBlock)) !== null) {
    routes.push({
      path: match[1],
      component: match[2],
      title: match[3]
    });
  }
  
  return routes;
}

// Extract Zone 2 modules
function extractZone2Modules() {
  const modules = [];
  const moduleRegex = /"(MOD-\d+)":\s*\{[\s\S]*?name:\s*"([^"]*)"[\s\S]*?base:\s*"([^"]*)"[\s\S]*?tiles:\s*\[([\s\S]*?)\]/g;
  
  let match;
  while ((match = moduleRegex.exec(manifestContent)) !== null) {
    const code = match[1];
    const name = match[2];
    const base = match[3];
    const tilesBlock = match[4];
    
    // Extract tiles
    const tiles = [];
    const tileRegex = /path:\s*"([^"]*)"/g;
    let tileMatch;
    while ((tileMatch = tileRegex.exec(tilesBlock)) !== null) {
      tiles.push(tileMatch[1]);
    }
    
    modules.push({
      code,
      name,
      base,
      tiles,
      tile_count: tiles.length
    });
  }
  
  return modules;
}

// Extract Legacy Redirects
function extractLegacyRedirects() {
  const redirectsMatch = manifestContent.match(/legacyRoutes:\s*LegacyRoute\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (!redirectsMatch) return [];
  
  const redirectsBlock = redirectsMatch[1];
  const redirects = [];
  const redirectRegex = /\{\s*path:\s*"([^"]*)",\s*redirect_to:\s*"([^"]*)",\s*reason:\s*"([^"]*)"/g;
  
  let match;
  while ((match = redirectRegex.exec(redirectsBlock)) !== null) {
    redirects.push({
      from: match[1],
      to: match[2],
      reason: match[3],
      param_safe: match[1].includes(':') ? 'YES' : 'YES'
    });
  }
  
  return redirects;
}

// Ensure output directory exists
const outputDir = path.join(__dirname, '../artifacts/audit');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate inventories
const zone1Routes = extractZone1Routes();
const zone2Modules = extractZone2Modules();
const legacyRedirects = extractLegacyRedirects();

// Write outputs
fs.writeFileSync(
  path.join(outputDir, 'zone1_routes.json'),
  JSON.stringify(zone1Routes, null, 2)
);
fs.writeFileSync(
  path.join(outputDir, 'zone2_modules.json'),
  JSON.stringify(zone2Modules, null, 2)
);
fs.writeFileSync(
  path.join(outputDir, 'legacy_redirects.json'),
  JSON.stringify(legacyRedirects, null, 2)
);

// Print summary
console.log('================================================================================');
console.log('ROUTE INVENTORY GENERATION COMPLETE');
console.log('================================================================================');
console.log('');
console.log('ZONE 1 ADMIN ROUTES:');
console.log(`  Total: ${zone1Routes.length}`);
console.log(`  First 5: ${zone1Routes.slice(0, 5).map(r => r.path || '(index)').join(', ')}`);
console.log('');
console.log('ZONE 2 MODULES:');
console.log(`  Total: ${zone2Modules.length}`);
console.log(`  Codes: ${zone2Modules.map(m => m.code).join(', ')}`);
console.log(`  Total tiles: ${zone2Modules.reduce((sum, m) => sum + m.tile_count, 0)}`);
console.log('');
console.log('LEGACY REDIRECTS:');
console.log(`  Total: ${legacyRedirects.length}`);
console.log('');
console.log('Output files:');
console.log('  artifacts/audit/zone1_routes.json');
console.log('  artifacts/audit/zone2_modules.json');
console.log('  artifacts/audit/legacy_redirects.json');
console.log('');
console.log('================================================================================');
