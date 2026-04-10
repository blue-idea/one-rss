import { describe, expect, it } from "vitest";

import { extractArticleImages, parseArticleContent } from "./articleContent";

describe("articleContent", () => {
  it("preserves image order across html and markdown blocks", () => {
    const content = [
      "<p>第一段</p>",
      '<img src="https://cdn.example.com/cover.jpg" alt="封面图" />',
      "![流程图](https://cdn.example.com/diagram.png)",
      "<p>第二段</p>",
    ].join("\n");

    expect(parseArticleContent(content)).toEqual([
      { type: "text", text: "第一段" },
      {
        type: "image",
        image: { url: "https://cdn.example.com/cover.jpg", alt: "封面图" },
      },
      {
        type: "image",
        image: { url: "https://cdn.example.com/diagram.png", alt: "流程图" },
      },
      { type: "text", text: "第二段" },
    ]);
  });

  it("extracts unique image urls for offline caching", () => {
    const content = [
      '<img src="https://cdn.example.com/cover.jpg" alt="封面图" />',
      '<img src="https://cdn.example.com/cover.jpg" alt="封面图" />',
      "![流程图](https://cdn.example.com/diagram.png)",
    ].join("\n");

    expect(extractArticleImages(content)).toEqual([
      { url: "https://cdn.example.com/cover.jpg", alt: "封面图" },
      { url: "https://cdn.example.com/diagram.png", alt: "流程图" },
    ]);
  });
});
