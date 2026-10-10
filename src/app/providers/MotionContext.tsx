import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getMotionSnapshot, getServerMotionSnapshot, subscribeMotion, toggleMotion } from '../motion';

interface MotionSettings {
  motionEnabled: boolean;
  paused: boolean;
  reducedMotion: boolean;
  toggleMotion: () => void;
}
const MotionContext = createContext<MotionSettings>({ motionEnabled: true, paused: false, reducedMotion: false, toggleMotion: () => {} });

export function MotionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeMotion, getMotionSnapshot, getServerMotionSnapshot);
  const value = useMemo(() => ({ ...snapshot, toggleMotion }), [snapshot]);
  return <MotionContext.Provider value={value}><div className="motionRoot" data-motion={value.motionEnabled ? 'playing' : 'paused'}>{children}</div></MotionContext.Provider>;
}
export function useMotion() { return useContext(MotionContext); }
