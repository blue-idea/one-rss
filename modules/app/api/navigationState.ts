/**
 * 导航状态管理 API
 * 实现一级导航切换与高亮、详情返回原列表并恢复滚动位置和筛选状态
 */

export type TabRoute = "today" | "curated" | "shelf" | "explore" | "profile";

export interface NavigationState {
  currentTab: TabRoute;
  scrollPositions: Record<TabRoute, number>;
  filterStates: Record<TabRoute, string>;
  timestamp: number;
}

const NAVIGATION_STATE_KEY = "@one_rss_navigation_state";

const DEFAULT_NAVIGATION_STATE: NavigationState = {
  currentTab: "today",
  scrollPositions: {
    today: 0,
    curated: 0,
    shelf: 0,
    explore: 0,
    profile: 0,
  },
  filterStates: {
    today: "all",
    curated: "all",
    shelf: "all",
    explore: "all",
    profile: "default",
  },
  timestamp: Date.now(),
};

/**
 * 保存导航状态
 */
export async function saveNavigationState(
  state: Partial<NavigationState>,
): Promise<void> {
  const currentState = await getNavigationState();
  const updatedState: NavigationState = {
    ...currentState,
    ...state,
    timestamp: Date.now(),
  };

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(updatedState));
  }
}

/**
 * 获取导航状态
 */
export async function getNavigationState(): Promise<NavigationState> {
  if (typeof localStorage === "undefined") {
    return DEFAULT_NAVIGATION_STATE;
  }

  try {
    const stored = localStorage.getItem(NAVIGATION_STATE_KEY);
    if (!stored) {
      return DEFAULT_NAVIGATION_STATE;
    }

    const parsed = JSON.parse(stored) as Partial<NavigationState>;

    // Validate and merge with defaults
    return {
      currentTab: parsed.currentTab || DEFAULT_NAVIGATION_STATE.currentTab,
      scrollPositions: {
        ...DEFAULT_NAVIGATION_STATE.scrollPositions,
        ...parsed.scrollPositions,
      },
      filterStates: {
        ...DEFAULT_NAVIGATION_STATE.filterStates,
        ...parsed.filterStates,
      },
      timestamp: parsed.timestamp || Date.now(),
    };
  } catch {
    return DEFAULT_NAVIGATION_STATE;
  }
}

/**
 * 更新当前 Tab
 */
export async function setCurrentTab(tab: TabRoute): Promise<void> {
  await saveNavigationState({ currentTab: tab });
}

/**
 * 更新指定 Tab 的滚动位置
 */
export async function setScrollPosition(
  tab: TabRoute,
  position: number,
): Promise<void> {
  const state = await getNavigationState();
  state.scrollPositions[tab] = position;
  await saveNavigationState(state);
}

/**
 * 更新指定 Tab 的筛选状态
 */
export async function setFilterState(
  tab: TabRoute,
  filter: string,
): Promise<void> {
  const state = await getNavigationState();
  state.filterStates[tab] = filter;
  await saveNavigationState(state);
}

/**
 * 重置导航状态为默认值
 */
export async function resetNavigationState(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(NAVIGATION_STATE_KEY);
  }
}
