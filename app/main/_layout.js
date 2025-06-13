import useUser from "@/store/userUser";
import { api } from "@/utils/api";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
export default function main() {
  const { setUser } = useUser();



  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const res = await api("/user/me", "GET", null, token);
        const data = res.data;
        setUser(data);
      } catch (error) {
        console.log("eror", error);
        Alert.alert("Error", "Failed to load profile data");
      }
    };
    loadUserProfile();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="customer" options={{ headerShown: false }} />
      <Stack.Screen name="technician/home" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      {/* You can add more screens specific to the main section here */}
    </Stack>
  );
}
