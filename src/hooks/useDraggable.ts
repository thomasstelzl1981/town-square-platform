/**
 * useDraggable Hook — Reusable drag-and-drop positioning
 * 
 * Features:
 * - Mouse drag support
 * - localStorage persistence
 * - Viewport boundary constraints
 * - Resize handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Position {
  x: number;
  y: number;
}

interface DraggableOptions {
  /** localStorage key for position persistence */
  storageKey?: string;
  /** Initial position (defaults to bottom-right) */
  initialPosition?: Position;
  /** Minimum distance from viewport edge */
  boundaryPadding?: number;
  /** Container dimensions for boundary calculation */
  containerSize?: { width: number; height: number };
  /** Disable dragging (e.g., on mobile) */
  disabled?: boolean;
}

interface DraggableResult {
  /** Current position */
  position: Position;
  /** Whether currently being dragged */
  isDragging: boolean;
  /** Props to spread on the drag handle element */
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
  };
  /** Reset position to default */
  resetPosition: () => void;
}

function getDefaultPosition(containerWidth: number, containerHeight: number, padding: number): Position {
  if (typeof window === 'undefined') {
    return { x: 100, y: 100 };
  }
  return {
    x: window.innerWidth - containerWidth - padding,
    y: window.innerHeight - containerHeight - padding - 100, // Some space from bottom
  };
}

function constrainPosition(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number,
  padding: number
): Position {
  if (typeof window === 'undefined') {
    return { x, y };
  }
  
  const maxX = window.innerWidth - containerWidth - padding;
  const maxY = window.innerHeight - containerHeight - padding;
  
  return {
    x: Math.max(padding, Math.min(x, maxX)),
    y: Math.max(padding, Math.min(y, maxY)),
  };
}

function loadStoredPosition(key: string): Position | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load stored position:', e);
  }
  return null;
}

function saveStoredPosition(key: string, position: Position): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(position));
  } catch (e) {
    console.warn('Failed to save position:', e);
  }
}

export function useDraggable(options: DraggableOptions = {}): DraggableResult {
  const {
    storageKey = 'draggable-position',
    initialPosition,
    boundaryPadding = 20,
    containerSize = { width: 320, height: 400 },
    disabled = false,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  
  // Ref for current position (for event handlers to avoid stale closures)
  const positionRef = useRef<Position | null>(null);
  
  // Initialize position with improved validation
  const [position, setPosition] = useState<Position>(() => {
    const defaultPos = getDefaultPosition(containerSize.width, containerSize.height, boundaryPadding);
    
    // Try to load from storage
    const stored = loadStoredPosition(storageKey);
    if (stored) {
      const constrained = constrainPosition(
        stored.x,
        stored.y,
        containerSize.width,
        containerSize.height,
        boundaryPadding
      );
      
      // Validate: position must be in valid viewport range
      // If constrained position differs too much from stored, the stored was invalid
      const isValid = 
        constrained.x >= boundaryPadding && 
        constrained.y >= boundaryPadding &&
        Math.abs(constrained.x - stored.x) <= 100 &&
        Math.abs(constrained.y - stored.y) <= 100;
      
      if (isValid) {
        positionRef.current = constrained;
        return constrained;
      }
      
      // Invalid stored position - clear it
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(storageKey);
        } catch (e) {
          // Ignore
        }
      }
    }
    
    // Use initial position if provided
    if (initialPosition) {
      const constrained = constrainPosition(
        initialPosition.x,
        initialPosition.y,
        containerSize.width,
        containerSize.height,
        boundaryPadding
      );
      positionRef.current = constrained;
      return constrained;
    }
    
    // Default position (bottom-right)
    positionRef.current = defaultPos;
    return defaultPos;
  });

  // Track drag offset
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keep positionRef in sync with position state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handle window resize - constrain position to new viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(
        prev.x,
        prev.y,
        containerSize.width,
        containerSize.height,
        boundaryPadding
      ));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerSize.width, containerSize.height, boundaryPadding]);

  // Mouse down handler for drag handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Use ref for current position to avoid stale closure
    const currentPos = positionRef.current || position;
    
    // Calculate offset from mouse to element position
    dragOffset.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - dragOffset.current.x;
      const newY = moveEvent.clientY - dragOffset.current.y;
      
      const constrained = constrainPosition(
        newX,
        newY,
        containerSize.width,
        containerSize.height,
        boundaryPadding
      );
      
      setPosition(constrained);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Save position to storage
      setPosition(currentPos => {
        saveStoredPosition(storageKey, currentPos);
        return currentPos;
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, position, containerSize.width, containerSize.height, boundaryPadding, storageKey]);

  // Reset position to default
  const resetPosition = useCallback(() => {
    const defaultPos = getDefaultPosition(containerSize.width, containerSize.height, boundaryPadding);
    setPosition(defaultPos);
    positionRef.current = defaultPos;
    saveStoredPosition(storageKey, defaultPos);
  }, [containerSize.width, containerSize.height, boundaryPadding, storageKey]);

  return {
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      style: {
        cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        userSelect: 'none' as const,
      },
    },
    resetPosition,
  };
}
