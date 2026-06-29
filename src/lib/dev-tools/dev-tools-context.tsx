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
import { useRouter } from "next/navigation";

import { resetCollaborationOnboarding } from "@/lib/collaboration-onboarding/storage";
import { fireDevToolsUnlockConfetti } from "@/lib/confetti";
import {
  dispatchDevToolsMockCollaborationChanged,
  dispatchDevToolsSimulateChanged,
  dispatchDevToolsUnlockedChanged,
} from "@/lib/dev-tools/events";
import {
  readDevToolsUnlocked,
  readMockCollaborationData,
  readSimulateNewUser,
  writeDevToolsUnlocked,
  writeMockCollaborationData,
  writeSimulateNewUser,
} from "@/lib/dev-tools/storage";
import { resetMockShareLinkOverrides } from "@/lib/dev-tools/mock-collaboration-data";

const UNLOCK_CLICKS = 7;
const UNLOCK_CLICK_WINDOW_MS = 2500;

type DevToolsContextValue = {
  isHubAdmin: boolean;
  userId: string;
  unlocked: boolean;
  simulateNewUser: boolean;
  mockCollaborationData: boolean;
  fabOpen: boolean;
  setFabOpen: (open: boolean) => void;
  registerUnlockClick: () => void;
  hideDevTools: () => void;
  setSimulateNewUser: (on: boolean) => void;
  setMockCollaborationData: (on: boolean) => void;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

type DevToolsProviderProps = {
  children: ReactNode;
  isHubAdmin: boolean;
  userId: string;
};

export function DevToolsProvider({
  children,
  isHubAdmin,
  userId,
}: DevToolsProviderProps) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [simulateNewUser, setSimulateNewUserState] = useState(false);
  const [mockCollaborationData, setMockCollaborationDataState] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const unlockClickTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setUnlocked(readDevToolsUnlocked());
    setSimulateNewUserState(readSimulateNewUser());
    setMockCollaborationDataState(readMockCollaborationData());
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
    writeMockCollaborationData(false);
    resetMockShareLinkOverrides();
    setUnlocked(false);
    setSimulateNewUserState(false);
    setMockCollaborationDataState(false);
    setFabOpen(false);
    unlockClickTimesRef.current = [];
    dispatchDevToolsUnlockedChanged(false);
    dispatchDevToolsSimulateChanged(false);
    dispatchDevToolsMockCollaborationChanged(false);
    router.refresh();
  }, [router]);

  const setSimulateNewUser = useCallback((on: boolean) => {
    writeSimulateNewUser(on);
    setSimulateNewUserState(on);
    dispatchDevToolsSimulateChanged(on);
  }, []);

  const setMockCollaborationData = useCallback(
    (on: boolean) => {
      writeMockCollaborationData(on);
      setMockCollaborationDataState(on);
      dispatchDevToolsMockCollaborationChanged(on);

      if (!on) {
        resetMockShareLinkOverrides();
      }

      if (on) {
        resetCollaborationOnboarding(userId);
        writeSimulateNewUser(true);
        setSimulateNewUserState(true);
        dispatchDevToolsSimulateChanged(true);
      }

      router.refresh();
    },
    [router, userId],
  );

  const value = useMemo<DevToolsContextValue>(
    () => ({
      isHubAdmin,
      userId,
      unlocked,
      simulateNewUser,
      mockCollaborationData,
      fabOpen,
      setFabOpen,
      registerUnlockClick,
      hideDevTools,
      setSimulateNewUser,
      setMockCollaborationData,
    }),
    [
      fabOpen,
      hideDevTools,
      isHubAdmin,
      mockCollaborationData,
      registerUnlockClick,
      setMockCollaborationData,
      setSimulateNewUser,
      simulateNewUser,
      unlocked,
      userId,
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

export function useMockCollaborationData(): boolean {
  const devTools = useDevTools();
  return devTools?.mockCollaborationData ?? false;
}
