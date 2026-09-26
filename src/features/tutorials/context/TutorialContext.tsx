import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { PublicTutorial } from '../types';
import { matchFeatureFromPathname } from '../featureRegistry';

interface TutorialContextValue {
  isOpen: boolean;
  selectedTutorial: PublicTutorial | null;
  expandedFeatureKey: string | null;
  openTutorial: (targetFeatureKey?: string) => void;
  closeTutorial: () => void;
  selectTutorial: (tutorial: PublicTutorial) => void;
  backToList: () => void;
  toggleFeatureExpanded: (featureKey: string) => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<PublicTutorial | null>(null);
  const [expandedFeatureKey, setExpandedFeatureKey] = useState<string | null>(null);
  const location = useLocation();

  const openTutorial = useCallback(
    (targetFeatureKey?: string) => {
      // Auto-detect feature from current route if not explicitly provided
      const matched = targetFeatureKey || matchFeatureFromPathname(location.pathname);
      if (matched) {
        setExpandedFeatureKey(matched);
      }
      setSelectedTutorial(null);
      setIsOpen(true);
    },
    [location.pathname]
  );

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setSelectedTutorial(null);
  }, []);

  const selectTutorial = useCallback((tutorial: PublicTutorial) => {
    setSelectedTutorial(tutorial);
  }, []);

  const backToList = useCallback(() => {
    setSelectedTutorial(null);
  }, []);

  const toggleFeatureExpanded = useCallback((featureKey: string) => {
    setExpandedFeatureKey((prev) => (prev === featureKey ? null : featureKey));
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isOpen,
        selectedTutorial,
        expandedFeatureKey,
        openTutorial,
        closeTutorial,
        selectTutorial,
        backToList,
        toggleFeatureExpanded,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
