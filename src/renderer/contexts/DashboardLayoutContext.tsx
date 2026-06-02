// src/renderer/contexts/DashboardLayoutContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type CardId = 
  | 'main-video'
  | 'active-prediction'
  | 'stream-goals-preview'
  | 'connection-hub'
  | 'connected-software'
  | 'quick-actions'
  | 'alerts'
  | 'stream-health'
  | 'viewer-list'
  | 'chat'
  | 'automations'
  | 'collaboration';

// Default layout: 4 columns, each column is an array of card IDs
const DEFAULT_LAYOUT: CardId[][] = [
  ['main-video', 'active-prediction', 'stream-goals-preview'],
  ['connection-hub', 'connected-software', 'quick-actions', 'alerts'],
  ['stream-health', 'viewer-list', 'chat'],
  ['automations', 'collaboration']
];

interface DashboardLayoutContextType {
  layout: CardId[][];
  isEditMode: boolean;
  toggleEditMode: () => void;
  moveCard: (cardId: CardId, fromCol: number, fromIndex: number, toCol: number, toIndex: number) => void;
  saveLayout: () => void;
  resetLayout: () => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
  return context;
};

const STORAGE_KEY = 'dashboard-layout';

export const DashboardLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layout, setLayout] = useState<CardId[][]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load saved layout from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLayout(JSON.parse(saved));
      } catch (e) { console.error(e); }
    } else {
      setLayout(DEFAULT_LAYOUT);
    }
  }, []);

  const moveCard = (cardId: CardId, fromCol: number, fromIndex: number, toCol: number, toIndex: number) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout.map(col => [...col])];
      // Remove from source
      newLayout[fromCol].splice(fromIndex, 1);
      // Insert into destination
      newLayout[toCol].splice(toIndex, 0, cardId);
      return newLayout;
    });
  };

  const saveLayout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    setIsEditMode(false);
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUT));
  };

  const toggleEditMode = () => setIsEditMode(prev => !prev);

  return (
    <DashboardLayoutContext.Provider value={{ layout, isEditMode, toggleEditMode, moveCard, saveLayout, resetLayout }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};