import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Stack,
  useGlobalSearchParams,
  usePathname,
  useRouter,
  type Href,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import {
  DEFAULT_AUTHENTICATED_HREF,
  isLoginPath,
  normalizePathname,
  sanitizeReturnTo,
} from "@/constants/auth-routes";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { BookmarkProvider } from "@/contexts/bookmark-context";
import { NavigationStateProvider } from "@/contexts/navigation-state-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthRedirectRoot() {
  const colorScheme = useColorScheme();
  const { isReady, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useGlobalSearchParams();
  const returnToRaw = searchParams.returnTo;
  const returnToParam =
    typeof returnToRaw === "string"
      ? returnToRaw
      : Array.isArray(returnToRaw)
        ? returnToRaw[0]
        : undefined;

  useEffect(() => {
    if (!isReady) return;
    void SplashScreen.hideAsync();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    const normalized = normalizePathname(pathname || "/");
    const onLoginRoute = isLoginPath(normalized);

    if (!isAuthenticated && !onLoginRoute) {
      router.replace({
        pathname: "/login",
        params: { returnTo: normalized },
      } as Href);
      return;
    }

    if (isAuthenticated && onLoginRoute) {
      const target =
        sanitizeReturnTo(returnToParam) ?? DEFAULT_AUTHENTICATED_HREF;
      router.replace(target as Href);
    }
  }, [isAuthenticated, isReady, pathname, returnToParam, router]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{
            presentation: "card",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="read"
          options={{
            presentation: "card",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <NavigationStateProvider>
          <AuthRedirectRoot />
        </NavigationStateProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}
