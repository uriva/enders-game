import { createContext, useContext } from 'react';

export interface GameContextType {
  onZoneEnter?: (zoneId: string) => void;
}

export const GameContext = createContext<GameContextType>({});

export function useGameContext() {
  return useContext(GameContext);
}
