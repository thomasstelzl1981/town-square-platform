#!/usr/bin/env node
/**
 * Route Inventory Generator
 * Reads routesManifest.ts and outputs JSON inventories for audit verification.
 *
 * Usage: node scripts/generate-route-inventory.js
 * Output: artifacts/audit/zone1_routes.json
 *         artifacts/audit/zone2_modules.json
 *         artifacts/audit/zone3_sites.json
 *         artifacts/audit/legacy_redirects.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the manifest file
const manifestPath = path.join(__dirname, '../src/manifests/routesManifest.ts');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Extract Zone 1 routes
function extractZone1Routes() {
  // Match the entire zone1Admin routes array, handling any nesting depth
  const startIndex = manifestContent.indexOf('export const zone1Admin');
  if (startIndex === -1) return [];

  const routesStart = manifestContent.indexOf('routes: [', startIndex);
  if (routesStart === -1) return [];

  // Find the closing of the routes array by tracking bracket depth
  let depth = 0;
  let arrayStart = manifestContent.indexOf('[', routesStart);
  let arrayEnd = -1;
  for (let i = arrayStart; i < manifestContent.length; i++) {
    if (manifestContent[i] === '[') depth++;
    else if (manifestContent[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) return [];

  const routesBlock = manifestContent.slice(arrayStart + 1, arrayEnd);
  const routes = [];
  const routeRegex = /\{\s*path:\s*"([^"]*)",\s*component:\s*"([^"]*)",\s*title:\s*"([^"]*)"/g;

  let match;
  while ((match = routeRegex.exec(routesBlock)) !== null) {
    routes.push({
      path: match[1],
      component: match[2],
      title: match[3],
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
      tile_count: tiles.length,
    });
  }

  return modules;
}

// Extract Zone 3 Sites
function extractZone3Sites() {
  const startIndex = manifestContent.indexOf('export const zone3Websites');
  if (startIndex === -1) return [];

  const objectStart = manifestContent.indexOf('{', startIndex);
  if (objectStart === -1) return [];

  // Find the matching closing brace
  let depth = 0;
  let objectEnd = -1;
  for (let i = objectStart; i < manifestContent.length; i++) {
    if (manifestContent[i] === '{') depth++;
    else if (manifestContent[i] === '}') {
      depth--;
      if (depth === 0) {
        objectEnd = i;
        break;
      }
    }
  }
  if (objectEnd === -1) return [];

  const websitesBlock = manifestContent.slice(objectStart + 1, objectEnd);

  // Extract each site key, base, layout and route count
  const sites = [];
  // Match top-level site keys (quoted or unquoted identifiers)
  const siteKeyRegex = /(?:^|\n)\s*['"]?([\w-]+)['"]?\s*:\s*\{[\s\S]*?base:\s*"([^"]*)"[\s\S]*?layout:\s*"([^"]*)"[\s\S]*?routes:\s*\[/g;
  let siteMatch;
  while ((siteMatch = siteKeyRegex.exec(websitesBlock)) !== null) {
    const siteKey = siteMatch[1];
    const base = siteMatch[2];
    const layout = siteMatch[3];

    // Find the routes array for this site
    const routesArrayPos = siteMatch.index + siteMatch[0].length - 1; // position of '['
    let rDepth = 0;
    let rEnd = -1;
    for (let i = routesArrayPos; i < websitesBlock.length; i++) {
      if (websitesBlock[i] === '[') rDepth++;
      else if (websitesBlock[i] === ']') {
        rDepth--;
        if (rDepth === 0) {
          rEnd = i;
          break;
        }
      }
    }

    const routes = [];
    if (rEnd !== -1) {
      const routesBlock = websitesBlock.slice(routesArrayPos + 1, rEnd);
      const routeRegex = /path:\s*"([^"]*)"[\s\S]*?component:\s*"([^"]*)"[\s\S]*?title:\s*"([^"]*)"/g;
      let routeMatch;
      while ((routeMatch = routeRegex.exec(routesBlock)) !== null) {
        routes.push({
          path: routeMatch[1],
          component: routeMatch[2],
          title: routeMatch[3],
        });
      }
    }

    sites.push({
      key: siteKey,
      base,
      layout,
      route_count: routes.length,
      routes,
    });
  }

  return sites;
}

// Extract Legacy Redirects
function extractLegacyRedirects() {
  const startIndex = manifestContent.indexOf('export const legacyRoutes');
  if (startIndex === -1) return [];

  // Use '= [' to skip past the LegacyRoute[] type annotation
  const assignPos = manifestContent.indexOf('= [', startIndex);
  if (assignPos === -1) return [];
  const arrayStart = assignPos + 2; // position of '['

  // Find the matching closing bracket
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < manifestContent.length; i++) {
    if (manifestContent[i] === '[') depth++;
    else if (manifestContent[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) return [];

  const redirectsBlock = manifestContent.slice(arrayStart + 1, arrayEnd);
  const redirects = [];
  const redirectRegex =
    /\{\s*path:\s*"([^"]*)",\s*redirect_to:\s*"([^"]*)",\s*reason:\s*"([^"]*)"/g;

  let match;
  while ((match = redirectRegex.exec(redirectsBlock)) !== null) {
    redirects.push({
      from: match[1],
      to: match[2],
      reason: match[3],
      param_safe: match[1].includes(':') ? 'YES' : 'YES',
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
const zone3Sites = extractZone3Sites();
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
  path.join(outputDir, 'zone3_sites.json'),
  JSON.stringify(zone3Sites, null, 2)
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
console.log(`  First 5: ${zone1Routes.slice(0, 5).map((r) => r.path || '(index)').join(', ')}`);
console.log('');
console.log('ZONE 2 MODULES:');
console.log(`  Total: ${zone2Modules.length}`);
console.log(`  Codes: ${zone2Modules.map((m) => m.code).join(', ')}`);
console.log(`  Total tiles: ${zone2Modules.reduce((sum, m) => sum + m.tile_count, 0)}`);
console.log('');
console.log('ZONE 3 SITES:');
console.log(`  Total: ${zone3Sites.length}`);
console.log(`  Sites: ${zone3Sites.map((s) => s.key).join(', ')}`);
console.log(`  Total routes: ${zone3Sites.reduce((sum, s) => sum + s.route_count, 0)}`);
console.log('');
console.log('LEGACY REDIRECTS:');
console.log(`  Total: ${legacyRedirects.length}`);
console.log('');
console.log('Output files:');
console.log('  artifacts/audit/zone1_routes.json');
console.log('  artifacts/audit/zone2_modules.json');
console.log('  artifacts/audit/zone3_sites.json');
console.log('  artifacts/audit/legacy_redirects.json');
console.log('');
console.log('================================================================================');

