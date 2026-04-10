import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type StoredScreenState = {
  filters: Record<string, unknown>;
  scrollY: number;
};

type NavigationStateMap = Record<string, StoredScreenState>;

type NavigationStateContextValue = {
  screens: NavigationStateMap;
  setScreenState: (key: string, state: StoredScreenState) => void;
};

const NavigationStateContext =
  createContext<NavigationStateContextValue | null>(null);

export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const [screens, setScreens] = useState<NavigationStateMap>({});

  const setScreenState = useCallback(
    (key: string, state: StoredScreenState) => {
      setScreens((prev) => {
        const current = prev[key];
        if (
          current?.scrollY === state.scrollY &&
          JSON.stringify(current.filters) === JSON.stringify(state.filters)
        ) {
          return prev;
        }

        return {
          ...prev,
          [key]: state,
        };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ screens, setScreenState }),
    [screens, setScreenState],
  );

  return (
    <NavigationStateContext.Provider value={value}>
      {children}
    </NavigationStateContext.Provider>
  );
}

export function usePersistentScreenState<T extends Record<string, unknown>>(
  key: string,
  initialFilters: T,
): {
  filters: T;
  setFilters: Dispatch<SetStateAction<T>>;
  scrollY: number;
  setScrollY: Dispatch<SetStateAction<number>>;
} {
  const context = useContext(NavigationStateContext);

  if (!context) {
    throw new Error(
      "usePersistentScreenState must be used within a NavigationStateProvider",
    );
  }

  const stored = context.screens[key];
  const [filters, setFilters] = useState<T>(
    () => ((stored?.filters as T | undefined) ?? initialFilters) as T,
  );
  const [scrollY, setScrollY] = useState<number>(() => stored?.scrollY ?? 0);

  useEffect(() => {
    context.setScreenState(key, {
      filters,
      scrollY,
    });
  }, [context, filters, key, scrollY]);

  return {
    filters,
    setFilters,
    scrollY,
    setScrollY,
  };
}
