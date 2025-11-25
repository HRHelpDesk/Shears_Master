import React, { createContext, useContext, useEffect, useState } from "react";
import { useStripeTerminal } from "@stripe/stripe-terminal-react-native";
import { AuthContext } from "./AuthContext";

const TerminalContext = createContext();
export const useTerminal = () => useContext(TerminalContext);

export function TerminalProvider({ children }) {
  const { user, token } = useContext(AuthContext);

  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const {
    initialize,
    discoverReaders,
    connectReader,
    connectedReader,
    connectionStatus,
    discoveredReaders,
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal({
    onDidChangeConnectionStatus: (status) => {
      console.log("🔄 Global Terminal Status:", status);
    },
    onUpdateDiscoveredReaders: (readers) => {
      console.log("📡 Global Discovered Readers:", readers);
    },
  });


  /* ---------------------------------------------------------
      ⭐ Initialize ONLY when user has a Stripe Account ID
  --------------------------------------------------------- */
  useEffect(() => {
    const start = async () => {
      if (!user?.stripeAccountId) {
        console.log("⚠ No stripeAccountId — Terminal disabled.");
        return;
      }

      if (initialized || initializing) return;

      setInitializing(true);

      console.log("⚡ Initializing Terminal (GLOBAL)…");
      const { error } = await initialize();

      if (error) {
        console.log("❌ Terminal init error:", error);
        setInitializing(false);
        return;
      }

      console.log("✅ Terminal initialized");
      setInitialized(true);
      setInitializing(false);
    };

    start();
  }, [user?.stripeAccountId, initialize, initialized, initializing]);


  /* ---------------------------------------------------------
      ⭐ Reconnect helper
  --------------------------------------------------------- */
  const reconnect = async () => {
    if (!discoveredReaders?.length) return null;

    const reader = discoveredReaders[0];
    console.log("🔁 Reconnecting to last reader:", reader);

    const { error } = await connectReader(reader);
    if (error) console.log("❌ Reconnect failed:", error);

    return !error;
  };


  return (
    <TerminalContext.Provider
      value={{
        initialized,
        initializing,
        connectedReader,
        connectionStatus,

        discoverReaders,
        connectReader,
        discoveredReaders,

        reconnect,

        createPaymentIntent,
        collectPaymentMethod,
        confirmPaymentIntent,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}
