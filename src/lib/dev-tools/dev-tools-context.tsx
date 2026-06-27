"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fireDevToolsUnlockConfetti } from "@/lib/confetti";
import {
  dispatchDevToolsSimulateChanged,
  dispatchDevToolsUnlockedChanged,
} from "@/lib/dev-tools/events";
import {
  readDevToolsUnlocked,
  readSimulateNewUser,
  writeDevToolsUnlocked,
  writeSimulateNewUser,
} from "@/lib/dev-tools/storage";

const UNLOCK_CLICKS = 7;
const UNLOCK_CLICK_WINDOW_MS = 2500;

type DevToolsContextValue = {
  isHubAdmin: boolean;
  unlocked: boolean;
  simulateNewUser: boolean;
  fabOpen: boolean;
  setFabOpen: (open: boolean) => void;
  registerUnlockClick: () => void;
  hideDevTools: () => void;
  setSimulateNewUser: (on: boolean) => void;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

type DevToolsProviderProps = {
  children: ReactNode;
  isHubAdmin: boolean;
};

export function DevToolsProvider({ children, isHubAdmin }: DevToolsProviderProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [simulateNewUser, setSimulateNewUserState] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const unlockClickTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setUnlocked(readDevToolsUnlocked());
    setSimulateNewUserState(readSimulateNewUser());
  }, []);

  const unlockDevTools = useCallback(() => {
    writeDevToolsUnlocked(true);
    setUnlocked(true);
    dispatchDevToolsUnlockedChanged(true);
    fireDevToolsUnlockConfetti();
  }, []);

  const registerUnlockClick = useCallback(() => {
    if (!isHubAdmin) return;

    if (unlocked) {
      setFabOpen((current) => !current);
      return;
    }

    const now = Date.now();
    const recent = unlockClickTimesRef.current.filter(
      (time) => now - time < UNLOCK_CLICK_WINDOW_MS,
    );
    recent.push(now);
    unlockClickTimesRef.current = recent;

    if (recent.length >= UNLOCK_CLICKS) {
      unlockClickTimesRef.current = [];
      unlockDevTools();
    }
  }, [isHubAdmin, unlockDevTools, unlocked]);

  const hideDevTools = useCallback(() => {
    writeDevToolsUnlocked(false);
    writeSimulateNewUser(false);
    setUnlocked(false);
    setSimulateNewUserState(false);
    setFabOpen(false);
    unlockClickTimesRef.current = [];
    dispatchDevToolsUnlockedChanged(false);
    dispatchDevToolsSimulateChanged(false);
  }, []);

  const setSimulateNewUser = useCallback((on: boolean) => {
    writeSimulateNewUser(on);
    setSimulateNewUserState(on);
    dispatchDevToolsSimulateChanged(on);
  }, []);

  const value = useMemo<DevToolsContextValue>(
    () => ({
      isHubAdmin,
      unlocked,
      simulateNewUser,
      fabOpen,
      setFabOpen,
      registerUnlockClick,
      hideDevTools,
      setSimulateNewUser,
    }),
    [
      fabOpen,
      hideDevTools,
      isHubAdmin,
      registerUnlockClick,
      setSimulateNewUser,
      simulateNewUser,
      unlocked,
    ],
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}

export function useDevTools(): DevToolsContextValue | null {
  return useContext(DevToolsContext);
}

export function useSimulateNewUser(): boolean {
  const devTools = useDevTools();
  return devTools?.simulateNewUser ?? false;
}
