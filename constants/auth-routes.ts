/**
 * 认证相关路由约定：与 Expo Router 实际 pathname 对齐（见 app-tab-bar 等）。
 * 未登录仅允许访问登录入口；其余路径一律拦截并附带安全回跳参数。
 */

export const LOGIN_PATHNAME = "/login";

/** 登录成功后默认落地「今日」页（与主导航 href 一致） */
export const DEFAULT_AUTHENTICATED_HREF = "/";

const ALLOWED_RETURN_PATHS = new Set([
  "/",
  "/index",
  "/explore",
  "/shelf",
  "/profile",
  "/read",
  "/modal",
]);

function stripQuery(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

/**
 * 规范化 pathname，避免尾斜杠与查询干扰判断。
 */
export function normalizePathname(pathname: string): string {
  const p = pathname.trim();
  if (p === "" || p === "/") return "/";
  const noQuery = stripQuery(p);
  return noQuery.length > 1 && noQuery.endsWith("/")
    ? noQuery.slice(0, -1)
    : noQuery;
}

export function isLoginPath(pathname: string): boolean {
  return normalizePathname(pathname) === LOGIN_PATHNAME;
}

/**
 * 校验登录回跳地址，防止开放重定向；仅允许应用内白名单路径。
 */
export function sanitizeReturnTo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("..")) return null;
  const pathOnly = normalizePathname(stripQuery(decoded));
  if (!ALLOWED_RETURN_PATHS.has(pathOnly)) return null;
  if (pathOnly === "/index") return "/";
  return pathOnly;
}
