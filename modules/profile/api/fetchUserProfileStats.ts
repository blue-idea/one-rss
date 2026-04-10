export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  return {
    subscriptionCount: 12,
    readCount: 48,
    bookmarkCount: 8,
  };
}
