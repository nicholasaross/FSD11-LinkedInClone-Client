import { createContext, useContext } from "react";

// context + hook live here (no component export) to keep the provider
// fast-refresh friendly, the same split AuthContext uses
export const ConnectionsContext = createContext(null);

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error("useConnections must be used within a ConnectionsProvider");
  }
  return context;
}
