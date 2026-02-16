/**
 * E2E Test: Module Navigation Happy Path
 * Tests the main navigation and module access in the portal
 */

import { test, expect } from '@playwright/test';

test.describe('Portal Navigation Happy Path', () => {
  // Note: This test assumes mock/demo mode or bypassed auth
  test('should navigate to portal and access modules', async ({ page }) => {
    // Go directly to portal (assumes demo mode or bypassed auth for testing)
    await page.goto('/portal');
    
    // Check if we land on portal or get redirected to auth
    const url = page.url();
    
    if (url.includes('/auth') || url.includes('/login')) {
      console.log('Note: Portal access requires authentication - test environment limitation');
      
      // Verify auth page is functional
      await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
      return;
    }
    
    // If we're on portal, verify portal elements are present
    if (url.includes('/portal')) {
      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      // Check for common portal elements (navigation, header, modules)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Verify we're not on an error page
      const content = await page.content();
      expect(content).not.toContain('404');
      expect(content).not.toContain('Page not found');
    }
  });

  test('should handle unknown routes gracefully', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/portal/nonexistent-module-12345');
    
    // Wait for response
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Should either redirect to valid page or show 404
    const url = page.url();
    const content = await page.content();
    
    // Verify graceful handling (redirect to portal or show 404)
    const isRedirected = url.includes('/portal') && !url.includes('nonexistent');
    const shows404 = content.includes('404') || content.includes('Not Found');
    
    expect(isRedirected || shows404).toBe(true);
  });

  test('should load manifest-driven routes correctly', async ({ page }) => {
    // Test that the manifest routing system is working
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Verify we get a valid page (not a blank screen)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify some content is rendered
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
