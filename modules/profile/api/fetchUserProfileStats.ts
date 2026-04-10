export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

const fallbackStats: UserProfileStats = {
  subscriptionCount: 0,
  readCount: 0,
  bookmarkCount: 0,
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  return fallbackStats;
}
