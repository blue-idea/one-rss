/**
 * RSS Reader App Theme - Design System
 * Based on "The Editorial Archive" design concept
 */

import { Platform } from "react-native";

const primaryColor = "#0058bc";
const primaryContainerColor = "#0070eb";
const surfaceColor = "#f9f9fc";
const surfaceContainerLow = "#f3f3f6";
const surfaceContainerHigh = "#e8e8ea";
const surfaceContainerHighest = "#e2e2e5";
const onSurfaceColor = "#1a1c1e";
const onSurfaceVariantColor = "#414755";
const outlineVariantColor = "#c1c6d7";
const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    primary: primaryColor,
    primaryContainer: primaryContainerColor,
    onPrimary: "#ffffff",
    onPrimaryContainer: "#fefcff",
    secondary: "#405e96",
    secondaryContainer: "#a1befd",
    onSecondary: "#ffffff",
    onSecondaryContainer: "#2d4c83",
    tertiary: "#9e3d00",
    tertiaryContainer: "#c64f00",
    onTertiary: "#ffffff",
    onTertiaryContainer: "#fffbff",
    error: "#ba1a1a",
    errorContainer: "#ffdad6",
    onError: "#ffffff",
    onErrorContainer: "#93000a",
    surface: surfaceColor,
    surfaceDim: "#dadadc",
    surfaceBright: "#f9f9fc",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: surfaceContainerLow,
    surfaceContainer: "#eeeef0",
    surfaceContainerHigh: surfaceContainerHigh,
    surfaceContainerHighest: surfaceContainerHighest,
    surfaceVariant: "#e2e2e5",
    onSurface: onSurfaceColor,
    onSurfaceVariant: onSurfaceVariantColor,
    outline: "#717786",
    outlineVariant: outlineVariantColor,
    inverseSurface: "#2f3133",
    inverseOnSurface: "#f0f0f3",
    inversePrimary: "#adc6ff",
    surfaceTint: "#005bc1",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    primary: "#adc6ff",
    primaryContainer: "#004493",
    onPrimary: "#001a41",
    onPrimaryContainer: "#d8e2ff",
    secondary: "#a1befd",
    secondaryContainer: "#26467d",
    onSecondary: "#001a41",
    onSecondaryContainer: "#d8e2ff",
    tertiary: "#ffb595",
    tertiaryContainer: "#7c2e00",
    onTertiary: "#351000",
    onTertiaryContainer: "#ffdbcc",
    error: "#ffb4ab",
    errorContainer: "#93000a",
    onError: "#690005",
    onErrorContainer: "#ffdad6",
    surface: "#1a1c1e",
    surfaceDim: "#1a1c1e",
    surfaceBright: "#1a1c1e",
    surfaceContainerLowest: "#111316",
    surfaceContainerLow: "#1f2124",
    surfaceContainer: "#232528",
    surfaceContainerHigh: "#2d2f32",
    surfaceContainerHighest: "#383a3d",
    surfaceVariant: "#414755",
    onSurface: "#e2e2e5",
    onSurfaceVariant: "#c1c6d7",
    outline: "#8b9099",
    outlineVariant: "#414755",
    inverseSurface: "#e2e2e5",
    inverseOnSurface: "#2f3133",
    inversePrimary: "#0058bc",
    surfaceTint: "#adc6ff",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
