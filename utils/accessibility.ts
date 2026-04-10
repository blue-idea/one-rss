export const MAX_FONT_SCALE = 2;

function normalizeHex(hex: string): string {
  const value = hex.trim().replace("#", "");
  if (value.length === 3) {
    return value
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  if (value.length !== 6) {
    throw new Error(`Unsupported color format: ${hex}`);
  }

  return value;
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const fg = normalizeHex(foreground);
  const bg = normalizeHex(background);

  const [fr, fgc, fb] = [0, 2, 4].map((index) =>
    parseInt(fg.slice(index, index + 2), 16),
  );
  const [br, bgc, bb] = [0, 2, 4].map((index) =>
    parseInt(bg.slice(index, index + 2), 16),
  );

  const foregroundLuminance =
    0.2126 * channelToLinear(fr) +
    0.7152 * channelToLinear(fgc) +
    0.0722 * channelToLinear(fb);
  const backgroundLuminance =
    0.2126 * channelToLinear(br) +
    0.7152 * channelToLinear(bgc) +
    0.0722 * channelToLinear(bb);

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function isWcagAaCompliant(
  foreground: string,
  background: string,
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 3 : 4.5);
}

export function getBookmarkAccessibilityLabel(
  title: string,
  isBookmarked: boolean,
): string {
  return isBookmarked ? `取消收藏《${title}》` : `收藏《${title}》`;
}

export function getArticleCardAccessibilityLabel(
  title: string,
  source: string,
  meta: string,
): string {
  return `${title}，来源 ${source}${meta ? `，${meta}` : ""}`;
}
