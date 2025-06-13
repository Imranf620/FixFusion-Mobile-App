import SplashScreen from "@/components/SplashScreen";
import useUser from "@/store/userUser";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function Splash() {
  const router = useRouter();
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const userData = await SecureStore.getItemAsync("user");
    
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          const role = parsedUser?.role;

          if (role === "customer") {
            router.replace("/main/customer/home");
          } else if (role === "technician") {
            router.replace("/main/technician/home");
          } else if (role === "admin") {
            router.replace("/main/admin/dashboard");
          } else {
            router.replace("/auth/login");
          }
        } else {
          router.replace("/auth/login");
        }
      } catch (err) {
        console.error("Error loading user:", err);
        router.replace("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  return <SplashScreen />;
}
