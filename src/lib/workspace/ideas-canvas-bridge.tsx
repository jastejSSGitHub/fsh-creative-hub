"use client";

import { createContext, useContext, type ReactNode } from "react";

type IdeasCanvasBridgeValue = {
  initiativeId: string;
  projectId: string;
  onViewAssets?: () => void;
  onCreateTaskFromSticky?: (text: string) => void;
};

const IdeasCanvasBridgeContext = createContext<IdeasCanvasBridgeValue | null>(null);

export function IdeasCanvasBridgeProvider({
  value,
  children,
}: {
  value: IdeasCanvasBridgeValue;
  children: ReactNode;
}) {
  return (
    <IdeasCanvasBridgeContext.Provider value={value}>
      {children}
    </IdeasCanvasBridgeContext.Provider>
  );
}

export function useIdeasCanvasBridge(): IdeasCanvasBridgeValue | null {
  return useContext(IdeasCanvasBridgeContext);
}
