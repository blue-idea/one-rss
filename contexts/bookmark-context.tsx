import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { useNetworkStatus } from "@/contexts/network-context";
import { guardWriteAction } from "@/modules/write/write-action";

const BOOKMARKS_STORAGE_KEY = "@one_rss_bookmarks";

type BookmarkState = Set<string>;

export interface BookmarkContextValue {
  bookmarkedIds: BookmarkState;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<BookmarkState>(new Set());
  const bookmarkedIdsRef = useRef(bookmarkedIds);
  const { isOnline } = useNetworkStatus();

  // Load bookmarks from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          const nextState = new Set<string>(parsed);
          bookmarkedIdsRef.current = nextState;
          setBookmarkedIds(nextState);
        }
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      }
    })();
  }, []);

  useEffect(() => {
    bookmarkedIdsRef.current = bookmarkedIds;
  }, [bookmarkedIds]);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.has(id),
    [bookmarkedIds],
  );

  const toggleBookmark = useCallback(
    async (id: string) => {
      await guardWriteAction(isOnline, async () => {
        const previousState = bookmarkedIdsRef.current;
        const nextState = new Set(previousState);

        if (nextState.has(id)) {
          nextState.delete(id);
        } else {
          nextState.add(id);
        }

        bookmarkedIdsRef.current = nextState;
        setBookmarkedIds(nextState);

        try {
          await AsyncStorage.setItem(
            BOOKMARKS_STORAGE_KEY,
            JSON.stringify([...nextState]),
          );
        } catch (error) {
          bookmarkedIdsRef.current = previousState;
          setBookmarkedIds(previousState);
          throw error;
        }
      });
    },
    [isOnline],
  );

  const value = useMemo(
    () => ({ bookmarkedIds, isBookmarked, toggleBookmark }),
    [bookmarkedIds, isBookmarked, toggleBookmark],
  );

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
