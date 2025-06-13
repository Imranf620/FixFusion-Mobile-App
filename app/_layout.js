import { useColorScheme } from "@/hooks/useColorScheme";
import { registerForPushNotificationsAsync } from "@/utils/notificationUtils";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
    const sendPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        const authToken = await SecureStore.getItemAsync("token");

        if (token && authToken) {
          await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/notifications/save-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ expoPushToken: token }),
            }
          );
        }
      } catch (err) {
        console.log("Push token registration error:", err);
      }
    };

    sendPushToken();
  }, []);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📬 Notification received in foreground:", notification);
        const { title, body } = notification.request.content;
        Alert.alert(title || "Notification", body || "You got a message");
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("📲 User tapped notification:", response);
        const screen = response.notification.request.content.data?.screen;
        if (screen) {
          router.push(`/${screen}`); // Example: 'technician/job-details'
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Toast />
      <Stack>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="main" options={{ headerShown: false }} />
        <Stack.Screen
          name="customer/createRepairRequest"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
