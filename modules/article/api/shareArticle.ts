/**
 * 系统分享 API
 * 支持文章标题、链接、摘要分享
 */

export type ShareOptions = {
  title: string;
  url?: string;
  message?: string;
};

export type ShareResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * 生成文章分享文本
 * @param title 文章标题
 * @param url 文章链接
 * @returns 格式化分享文本
 */
export function formatShareText(title: string, url?: string): string {
  return url ? `${title}\n${url}` : title;
}

/**
 * 分享文章（需要在 React Native 环境调用）
 * @param options 分享选项（标题、链接、摘要）
 * @returns 分享结果
 */
export async function shareArticle(
  options: ShareOptions,
): Promise<ShareResult> {
  const { title, url, message } = options;

  // Dynamic import to avoid test environment issues
  const { Share, Platform } = await import("react-native");

  const content = message || formatShareText(title, url);

  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? { title, message: content, url }
        : { message: content },
    );

    if (result.action === Share.sharedAction) {
      return { ok: true };
    }

    if (result.action === Share.dismissedAction) {
      return {
        ok: false,
        code: "DISMISSED",
        message: "Share was dismissed by user.",
      };
    }

    return {
      ok: false,
      code: "UNKNOWN",
      message: "Unknown share action.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to share article.";
    return {
      ok: false,
      code: "SHARE_ERROR",
      message: errorMessage,
    };
  }
}
