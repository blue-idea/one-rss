export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

const DEFAULT_STATS: UserProfileStats = {
  subscriptionCount: 5,
  readCount: 128,
  bookmarkCount: 12,
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  return DEFAULT_STATS;
}
