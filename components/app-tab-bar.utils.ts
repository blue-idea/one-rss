export type TabKey = "index" | "explore" | "shelf" | "profile";

export const getActiveFromPath = (pathname: string): TabKey | undefined => {
  if (pathname === "/" || pathname === "/index") return "index";
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/shelf")) return "shelf";
  if (pathname.startsWith("/profile")) return "profile";
  return undefined;
};
