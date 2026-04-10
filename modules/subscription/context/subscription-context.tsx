import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createInitialSubscriptionState,
  getDiscoverableFeeds,
  getShelfFeeds,
  importFeedByUrl,
  subscribeToFeed,
  unsubscribeFromFeed,
  type SubscriptionMutationResult,
  type SubscriptionNotice,
  type SubscriptionState,
} from "@/modules/subscription/domain/subscription-service";

type SubscriptionContextValue = {
  discoverableFeeds: ReturnType<typeof getDiscoverableFeeds>;
  shelfFeeds: ReturnType<typeof getShelfFeeds>;
  notice: SubscriptionNotice | null;
  state: SubscriptionState;
  clearNotice: () => void;
  importByUrl: (rawUrl: string) => SubscriptionMutationResult;
  toggleSubscription: (
    feedId: string,
    subscribed: boolean,
  ) => SubscriptionMutationResult;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialSubscriptionState);
  const [notice, setNotice] = useState<SubscriptionNotice | null>(null);

  const value = useMemo<SubscriptionContextValue>(() => {
    const updateNotice = (nextNotice: SubscriptionNotice) => {
      setNotice(nextNotice);
    };

    return {
      discoverableFeeds: getDiscoverableFeeds(state),
      shelfFeeds: getShelfFeeds(state),
      notice,
      state,
      clearNotice: () => setNotice(null),
      importByUrl: (rawUrl: string) => {
        const result = importFeedByUrl(state, rawUrl);
        setState(result.state);
        updateNotice(result.notice);
        return result;
      },
      toggleSubscription: (feedId: string, subscribed: boolean) => {
        const result = subscribed
          ? unsubscribeFromFeed(state, feedId)
          : subscribeToFeed(state, feedId);
        setState(result.state);
        updateNotice(result.notice);
        return result;
      },
    };
  }, [notice, state]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription 必须在 SubscriptionProvider 内使用");
  }
  return context;
}
