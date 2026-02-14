/**
 * SoT Login Transition — Tiles fly out, dashboard builds up.
 * Wraps the entire SoT layout and orchestrates exit animations.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SotLoginTransitionProps {
  children: React.ReactNode;
}

export function SotLoginTransition({ children }: SotLoginTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    // Wait for fly-out animation, then navigate
    setTimeout(() => {
      navigate('/portal');
    }, 900);
  }, [navigate]);

  return (
    <div 
      className="sot-transition-wrapper"
      data-transitioning={isTransitioning || undefined}
      style={{
        // Provide triggerTransition via CSS custom property hack — 
        // actually we pass it via context, see SotTransitionContext
      }}
    >
      <SotTransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
        {children}
      </SotTransitionContext.Provider>
    </div>
  );
}

// Context to allow SotDemoLogin to trigger the transition
import { createContext, useContext } from 'react';

interface SotTransitionContextType {
  triggerTransition: () => void;
  isTransitioning: boolean;
}

const SotTransitionContext = createContext<SotTransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const useSotTransition = () => useContext(SotTransitionContext);
