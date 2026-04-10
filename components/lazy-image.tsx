import { Image } from "expo-image";
import { memo } from "react";
import {
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";

type LazyImageProps = {
  uri?: string | null;
  shouldLoad: boolean;
  style?: StyleProp<ImageStyle>;
  contentFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  placeholderColor?: string;
  transition?: number;
};

function LazyImageComponent({
  uri,
  shouldLoad,
  style,
  contentFit = "cover",
  placeholderColor = "rgba(193, 198, 215, 0.35)",
  transition = 160,
}: LazyImageProps) {
  if (!uri || !shouldLoad) {
    return (
      <View
        style={[
          styles.placeholder,
          style,
          { backgroundColor: placeholderColor },
        ]}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
    />
  );
}

export const LazyImage = memo(LazyImageComponent);

const styles = StyleSheet.create({
  placeholder: {
    overflow: "hidden",
  },
});
