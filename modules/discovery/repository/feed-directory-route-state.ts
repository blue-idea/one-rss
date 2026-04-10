export type FeedDirectoryRouteState = {
  categorySlug: string;
  keyword: string;
  page: number;
};

type RouteParamValue = string | string[] | undefined;

type FeedDirectoryRouteParams = {
  category?: RouteParamValue;
  q?: RouteParamValue;
  page?: RouteParamValue;
};

function takeFirst(value: RouteParamValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

export function normalizeFeedDirectoryPage(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function parseFeedDirectoryRouteState(
  params: FeedDirectoryRouteParams,
  validCategorySlugs: string[],
): FeedDirectoryRouteState {
  const categoryCandidate = takeFirst(params.category) ?? "all";
  const keyword = (takeFirst(params.q) ?? "").trim();

  return {
    categorySlug: validCategorySlugs.includes(categoryCandidate)
      ? categoryCandidate
      : "all",
    keyword,
    page: normalizeFeedDirectoryPage(takeFirst(params.page)),
  };
}

export function buildFeedDirectoryRouteParams(
  state: FeedDirectoryRouteState,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.categorySlug !== "all") {
    params.category = state.categorySlug;
  }

  if (state.keyword.trim().length > 0) {
    params.q = state.keyword.trim();
  }

  if (state.page > 1) {
    params.page = String(state.page);
  }

  return params;
}
