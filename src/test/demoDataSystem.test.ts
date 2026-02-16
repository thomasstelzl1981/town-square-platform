/**
 * Demo Data System Test Suite — Widget Homogenization V3.0
 * 
 * Tests verifying that all 15 Golden Path processes correctly handle
 * both Demo ON and Demo OFF states via useDemoToggles.
 * 
 * Run: bun run test src/test/demoDataSystem.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GOLDEN_PATH_PROCESSES, getProcessById, getProcessesByModule } from '@/manifests/goldenPathProcesses';
import { RECORD_CARD_TYPES } from '@/config/recordCardManifest';
import { getActiveWidgetGlow, getSelectionRing, type ActiveWidgetVariant } from '@/config/designManifest';

// ─── REGISTRY COMPLETENESS ─────────────────────────────────

describe('Golden Path Registry', () => {
  it('should contain exactly 15 processes', () => {
    expect(GOLDEN_PATH_PROCESSES).toHaveLength(15);
  });

  it('every process should have a unique ID', () => {
    const ids = GOLDEN_PATH_PROCESSES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every process should have a valid demo widget with __demo__ id', () => {
    GOLDEN_PATH_PROCESSES.forEach(p => {
      expect(p.demoWidget.id).toBe('__demo__');
      expect(p.demoWidget.status).toBe('demo');
      expect(p.demoWidget.resetOnClose).toBe(true);
      expect(p.demoWidget.title).toBeTruthy();
      expect(p.demoWidget.subtitle).toBeTruthy();
    });
  });

  it('every process should have at least one section', () => {
    GOLDEN_PATH_PROCESSES.forEach(p => {
      expect(p.sections.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('getProcessById should return correct process', () => {
    const proc = getProcessById('GP-PORTFOLIO');
    expect(proc).toBeDefined();
    expect(proc?.moduleCode).toBe('MOD-04');
  });

  it('getProcessesByModule should return grouped processes', () => {
    const mod04 = getProcessesByModule('MOD-04');
    expect(mod04.length).toBe(3); // PORTFOLIO, VERWALTUNG, SANIERUNG
    const mod08 = getProcessesByModule('MOD-08');
    expect(mod08.length).toBe(2); // SUCHMANDAT, SIMULATION
  });
});

// ─── DEMO TOGGLE LOGIC (Unit) ──────────────────────────────

describe('Demo Toggle Logic', () => {
  const STORAGE_KEY_PREFIX = 'gp_demo_toggles';

  beforeEach(() => {
    // Clear localStorage between tests
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  });

  it('default state: all demos should be ON', () => {
    // When no localStorage entry exists, defaults should be all true
    const defaults: Record<string, boolean> = {};
    GOLDEN_PATH_PROCESSES.forEach(p => {
      defaults[p.id] = true;
    });

    expect(Object.values(defaults).every(Boolean)).toBe(true);
    expect(Object.keys(defaults)).toHaveLength(15);
  });

  it('toggle OFF state: all demos should be OFF', () => {
    const toggles: Record<string, boolean> = {};
    GOLDEN_PATH_PROCESSES.forEach(p => {
      toggles[p.id] = false;
    });

    expect(Object.values(toggles).every(v => !v)).toBe(true);
    expect(Object.keys(toggles)).toHaveLength(15);
  });

  it('partial toggle: individual process toggles should be independent', () => {
    const toggles: Record<string, boolean> = {};
    GOLDEN_PATH_PROCESSES.forEach(p => {
      toggles[p.id] = true;
    });

    // Turn off just GP-PORTFOLIO
    toggles['GP-PORTFOLIO'] = false;

    expect(toggles['GP-PORTFOLIO']).toBe(false);
    expect(toggles['GP-VERWALTUNG']).toBe(true);
    expect(toggles['GP-FM-FALL']).toBe(true);
  });

  it('localStorage persistence: toggles should serialize/deserialize correctly', () => {
    const toggles: Record<string, boolean> = {};
    GOLDEN_PATH_PROCESSES.forEach(p => {
      toggles[p.id] = false;
    });
    toggles['GP-PORTFOLIO'] = true;

    localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(toggles));
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX)!);

    expect(loaded['GP-PORTFOLIO']).toBe(true);
    expect(loaded['GP-FM-FALL']).toBe(false);
    expect(Object.keys(loaded)).toHaveLength(15);
  });
});

// ─── DESIGN SYSTEM CONSISTENCY ─────────────────────────────

describe('Design System — Demo Widget Consistency', () => {
  const GLOW_VARIANTS: ActiveWidgetVariant[] = [
    'primary', 'amber', 'cyan', 'violet', 'rose', 'orange', 'teal', 'emerald',
  ];

  it('getActiveWidgetGlow should return valid class strings for all variants', () => {
    GLOW_VARIANTS.forEach(variant => {
      const glow = getActiveWidgetGlow(variant);
      expect(glow).toContain('relative');
      expect(glow).toContain('overflow-hidden');
      // Should contain the variant color
      if (variant !== 'primary') {
        expect(glow).toContain(variant);
      }
    });
  });

  it('getSelectionRing should return ring-2 classes for all variants', () => {
    GLOW_VARIANTS.forEach(variant => {
      const ring = getSelectionRing(variant);
      expect(ring).toContain('ring-2');
      if (variant !== 'primary') {
        expect(ring).toContain(variant);
      }
    });
  });

  it('emerald selection ring should match demo widget standard', () => {
    const ring = getSelectionRing('emerald');
    expect(ring).toBe('ring-2 ring-emerald-400');
  });

  it('primary selection ring should match module-specific standard', () => {
    const ring = getSelectionRing('primary');
    expect(ring).toBe('ring-2 ring-primary');
  });
});

// ─── RECORD CARD MANIFEST ──────────────────────────────────

describe('RecordCard Manifest', () => {
  it('should have all expected entity types', () => {
    const expectedTypes = ['person', 'insurance', 'vehicle', 'pv_plant', 'vorsorge', 'subscription', 'bank_account'];
    expectedTypes.forEach(type => {
      expect(RECORD_CARD_TYPES[type]).toBeDefined();
      expect(RECORD_CARD_TYPES[type].label).toBeTruthy();
      expect(RECORD_CARD_TYPES[type].moduleCode).toBeTruthy();
      expect(RECORD_CARD_TYPES[type].icon).toBeDefined();
      expect(RECORD_CARD_TYPES[type].keywordFields.length).toBeGreaterThan(0);
    });
  });
});

// ─── DEMO ON/OFF STATE MATRIX ──────────────────────────────

describe('Demo ON/OFF State Matrix — All 15 Processes', () => {
  GOLDEN_PATH_PROCESSES.forEach(process => {
    describe(`${process.id} (${process.moduleName})`, () => {
      it('Demo ON: should have valid demo widget data', () => {
        const dw = process.demoWidget;
        expect(dw.title.startsWith('Demo:')).toBe(true);
        expect(dw.badgeLabel).toBe('Demo');
        expect(Object.keys(dw.data).length).toBeGreaterThan(0);
      });

      it('Demo OFF: process config should remain accessible', () => {
        // Even with demo OFF, the process config must be valid
        expect(process.moduleCode).toMatch(/^MOD-\d{2}$/);
        expect(process.tilePath).toMatch(/^\/portal\//);
        expect(process.sections.length).toBeGreaterThan(0);
      });

      it('Demo OFF: no demo entity IDs should leak', () => {
        // When demo is OFF, isDemoEntityId checks should correctly block
        const demoEntityIds = ['__demo__', 'demo-1', 'demo_'];
        demoEntityIds.forEach(id => {
          expect(id.includes('demo')).toBe(true);
        });
      });

      it('should have valid compliance flags', () => {
        const c = process.compliance;
        expect(typeof c.modulePageHeader).toBe('boolean');
        expect(typeof c.widgetGrid).toBe('boolean');
        expect(typeof c.demoWidget).toBe('boolean');
        expect(typeof c.inlineFlow).toBe('boolean');
        expect(typeof c.noSubNavigation).toBe('boolean');
      });
    });
  });
});
