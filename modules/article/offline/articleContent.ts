export type ArticleImageAsset = {
  url: string;
  alt: string | null;
};

export type ArticleContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      image: ArticleImageAsset;
    };

const HTML_IMAGE_REGEX = /<img\b[^>]*>/gi;
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const IMAGE_TOKEN_REGEX = /<img\b[^>]*>|!\[([^\]]*)\]\(([^)]+)\)/gi;

function getHtmlAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(new RegExp(`${attribute}=["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() || null;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|blockquote|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}

function normalizeParagraphs(input: string): string[] {
  return stripHtml(input)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function extractArticleImages(
  content: string | null | undefined,
): ArticleImageAsset[] {
  if (!content) {
    return [];
  }

  const images: ArticleImageAsset[] = [];
  for (const match of content.matchAll(HTML_IMAGE_REGEX)) {
    const tag = match[0];
    const url = getHtmlAttribute(tag, "src");
    if (url) {
      images.push({ url, alt: getHtmlAttribute(tag, "alt") });
    }
  }
  for (const match of content.matchAll(MARKDOWN_IMAGE_REGEX)) {
    const url = match[2]?.trim();
    if (url) {
      images.push({ url, alt: match[1]?.trim() || null });
    }
  }

  return images.filter(
    (image, index, list) =>
      list.findIndex((candidate) => candidate.url === image.url) === index,
  );
}

export function parseArticleContent(
  content: string | null | undefined,
): ArticleContentBlock[] {
  if (!content) {
    return [];
  }

  const blocks: ArticleContentBlock[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(IMAGE_TOKEN_REGEX)) {
    const matchText = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      const leadingText = content.slice(lastIndex, matchIndex);
      for (const paragraph of normalizeParagraphs(leadingText)) {
        blocks.push({ type: "text", text: paragraph });
      }
    }

    const tag = matchText.startsWith("<img") ? matchText : null;
    const markdownAlt = tag ? null : match[1]?.trim();
    const markdownUrl = tag ? null : match[2]?.trim();
    const url = tag ? getHtmlAttribute(tag, "src") : markdownUrl;
    const alt = tag ? getHtmlAttribute(tag, "alt") : markdownAlt || null;

    if (url) {
      blocks.push({
        type: "image",
        image: {
          url,
          alt,
        },
      });
    }

    lastIndex = matchIndex + matchText.length;
  }

  if (lastIndex < content.length) {
    const trailingText = content.slice(lastIndex);
    for (const paragraph of normalizeParagraphs(trailingText)) {
      blocks.push({ type: "text", text: paragraph });
    }
  }

  return blocks;
}
