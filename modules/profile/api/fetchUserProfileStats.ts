export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  return {
    subscriptionCount: 0,
    readCount: 0,
    bookmarkCount: 0,
  };
}
