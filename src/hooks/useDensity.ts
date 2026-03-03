import { useState, useEffect, useCallback } from 'react';

type Density = 'comfortable' | 'compact';

const STORAGE_KEY = 'sot-density';

function getStoredDensity(): Density {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'compact') return 'compact';
  } catch {}
  return 'comfortable';
}

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

export function useDensity() {
  const [density, setDensityState] = useState<Density>(getStoredDensity);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  const setDensity = useCallback((value: Density) => {
    setDensityState(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyDensity(value);
  }, []);

  const toggle = useCallback(() => {
    setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
  }, [density, setDensity]);

  return {
    density,
    setDensity,
    toggle,
    isCompact: density === 'compact',
  };
}
