import { useNavigation } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import LoadingOverlay from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { COLORS } from "@/constants/Colors";
import { TYPOGRAPHY } from "@/constants/Typography";
import { api } from "@/utils/api";

import { Lock, Mail, User } from "lucide-react-native";

const SignupScreen = () => {
  const [activeTab, setActiveTab] = useState("customer");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

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

  const handleSignup = async () => {
    const { firstName, lastName, email, password } = formData;

    if (!firstName || !lastName || !email || !password) {
      Toast.show({
        type: "error",
        text1: "All fields are required",
      });
      return;
    }

    if (!validateEmail(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid email address",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api("/user/signup", "POST", {
        ...formData,
        role: activeTab, 
      });

      Toast.show({
        type: "success",
        text1: "Signup successful",
      });

      navigation.navigate("auth/login");
    } catch (error) {

      console.log('error', error)
      Toast.show({
        type: "error",
        text1: "Signup failed",
        text2: error?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.primary }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
                  label="First Name"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChangeText={(val) => handleInputChange("firstName", val)}
                  icon={<User size={20} color={COLORS.text.primary} />}
                  required
                />

                <Input
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChangeText={(val) => handleInputChange("lastName", val)}
                  icon={<User size={20} color={COLORS.text.primary} />}
                  required
                />

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

                <Button fullWidth loading={loading} onPress={handleSignup} size="lg">
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>

                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("auth/login")}>
                    <Text style={styles.linkText}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} />

      <Toast />
    </>
  );
};

export default SignupScreen;

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
