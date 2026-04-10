import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const BOOKMARKS_STORAGE_KEY = "@one_rss_bookmarks";

type BookmarkState = Set<string>;

export interface BookmarkContextValue {
  bookmarkedIds: BookmarkState;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<BookmarkState>(new Set());

  // Load bookmarks from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setBookmarkedIds(new Set(parsed));
        }
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      }
    })();
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.has(id),
    [bookmarkedIds],
  );

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // Persist to storage
      AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify([...newSet]),
      ).catch((error) => {
        console.error("Failed to save bookmarks:", error);
      });
      return newSet;
    });
  }, []);

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
