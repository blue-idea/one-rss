import NetInfo from "@react-native-community/netinfo";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface NetworkContextValue {
  isOnline: boolean;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

function deriveOnlineState(
  isConnected: boolean | null,
  isInternetReachable: boolean | null | undefined,
): boolean {
  if (isConnected === false) {
    return false;
  }

  if (isInternetReachable === false) {
    return false;
  }

  return true;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;

    const syncState = (
      nextIsConnected: boolean | null,
      nextIsInternetReachable: boolean | null | undefined,
    ) => {
      if (!active) {
        return;
      }

      setIsOnline(deriveOnlineState(nextIsConnected, nextIsInternetReachable));
    };

    NetInfo.fetch()
      .then((state) => {
        syncState(state.isConnected, state.isInternetReachable);
      })
      .catch((error) => {
        console.error("Failed to fetch network state:", error);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      syncState(state.isConnected, state.isInternetReachable);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      isOffline: !isOnline,
    }),
    [isOnline],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkStatus must be used within a NetworkProvider");
  }

  return context;
}
