export type Subscription = {
  id: string;
  userId: string;
  feedId: string;
  isMuted: boolean;
  createdAt: string;
};

export type SubscribeResult = {
  subscription: Subscription;
  isNew: boolean;
};

export type UnsubscribeResult = {
  success: boolean;
};

export type ImportFeedResult = {
  feed: {
    id: string;
    title: string;
    url: string;
    imageUrl: string | null;
    siteUrl: string | null;
  };
  isNew: boolean;
};

export type SubscribeErrorCode =
  | "SUBSCRIPTION_LIMIT_EXCEEDED"
  | "FEED_NOT_FOUND"
  | "ALREADY_SUBSCRIBED"
  | "UNAUTHORIZED"
  | "NETWORK_ERROR"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";
