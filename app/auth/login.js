import LoadingOverlay from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { COLORS } from "@/constants/Colors";
import { TYPOGRAPHY } from "@/constants/Typography";
import { api } from "@/utils/api";
import { useNavigation } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

const LoginScreen =  () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("customer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "customer", label: "Customer" },
    { id: "technician", label: "Technician" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };
  

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Toast.show({
        type: "error",
        text1: "All fields are required",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      Toast.show({
        type: "error",
        text1: "Invalid email address",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api("/user/login", "POST", {
        ...formData,
        userType: activeTab,
      });

      Toast.show({
        type: "success",
        text1: "Login successful",
      });
      await SecureStore.setItemAsync('user', JSON.stringify(data.data.user));
      await SecureStore.setItemAsync('token', data.data.token);
      navigation.navigate("splash");

    } catch (error) {
      console.log("Login Error:", error);
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: error?.message || "Please try again",
        
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.logoText}>FixFusion</Text>

        <Card padding="xl">
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(val) => handleInputChange("email", val)}
              icon={<Mail size={20} color={COLORS.text.primary} />}
              keyboardType="email-address"
              required
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(val) => handleInputChange("password", val)}
              icon={<Lock size={20} color={COLORS.text.primary} />}
              secureTextEntry
              showPasswordToggle
              required
            />

            <View style={styles.rememberContainer}>
              <TouchableOpacity>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button fullWidth loading={loading} onPress={handleLogin} size="lg">
              {loading ? "Signing In..." : "Login"}
            </Button>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don’t have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("auth/signup")}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </View>

      <LoadingOverlay visible={loading} />
      <Toast />
    </ScrollView>
  );
};

export default LoginScreen;



const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    padding: 16,
  },
  innerContainer: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  logoText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.white,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "800",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  tabButtonActive: {
    backgroundColor: "white",
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  tabTextActive: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  form: {
    gap: 24,
  },
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  linkText: {
    color: "blue",
    fontWeight: "500",
  },
});
