export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

const DEFAULT_USER_PROFILE_STATS: UserProfileStats = {
  subscriptionCount: 0,
  readCount: 0,
  bookmarkCount: 0,
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  return DEFAULT_USER_PROFILE_STATS;
}
