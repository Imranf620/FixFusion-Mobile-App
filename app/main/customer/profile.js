import LoadingOverlay from "@/components/LoadingOverlay";
import { COLORS } from "@/constants/Colors";
import useUser from "@/store/userUser";
import { api } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const { user, setUser } = useUser();

  const navigation = useNavigation();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await api("/user/me", "GET", null, token);
      const data = res.data;

      setUser(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        city: data.location?.city || "",
        address: data.location?.address || "",
      });

      if (data.location?.coordinates && data.location.coordinates[0] !== 0) {
        setLocation({
          latitude: data.location.coordinates[1],
          longitude: data.location.coordinates[0],
        });
      }
    } catch (error) {
      console.log('eror',error)
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (form.phone && !/^(\+92|0)?[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = "Please provide a valid Pakistani phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setForm((prev) => ({
          ...prev,
          city: address.city || prev.city,
          address:
            `${address.street || ""} ${address.streetNumber || ""}`.trim() ||
            prev.address,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      const token = await SecureStore.getItemAsync("token");
      const formData = new FormData();

      // Add form fields
      formData.append("name", form.name);
      formData.append("phone", form.phone);

      // Add location as JSON string (as expected by your API)
      if (location || form.city || form.address) {
        const locationData = {
          type: "Point",
          coordinates: location
            ? [location.longitude, location.latitude]
            : [0, 0],
          city: form.city,
          address: form.address,
        };
        formData.append("location", JSON.stringify(locationData));
      }

      // Add profile image
      if (image) {
        const imageUri =
          Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri;
        formData.append("profileImage", {
          uri: imageUri,
          name: `profile-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
      }

      const response = await api("/user/update", "PUT", formData, token);
      if (response.statusCode === 200) {
        setUser(response.data);
        setImage(null);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Profile updated successfully!",
        });
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update profile",
      });
      console.log("error", error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerLogoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, loading]);

  // Updated handleLogout with confirmation dialog
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const token = await SecureStore.getItemAsync("token");
            await api("/user/logout", "POST", null, token);

            Toast.show({
              type: "success",
              text1: "Logged out",
              text2: "You have been logged out successfully",
            });

            await SecureStore.deleteItemAsync("token");
            await SecureStore.deleteItemAsync("user");


        
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Logout Failed",
              text2: error.message || "Failed to logout",
            });
          } finally {
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "auth/login" }],
              });
            }, 1000);
            setLoading(false);
          }
        },
      },
    ]);
  };
  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>
              Update your profile information
            </Text>
          </View>

          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {image ? (
                <Image
                  source={{ uri: process.env.EXPO_PUBLIC_API_URL.image.uri }}
                  style={styles.profileImage}
                />
              ) : user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="camera" size={32} color={COLORS.text.light} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color={COLORS.text.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageText}>Tap to change profile photo</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.text.light}
                value={form.name}
                onChangeText={(text) => {
                  setForm({ ...form, name: text });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="e.g., 03001234567"
                placeholderTextColor={COLORS.text.light}
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(text) => {
                  setForm({ ...form, phone: text });
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* City Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your city"
                placeholderTextColor={COLORS.text.light}
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
              />
            </View>

            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your complete address"
                placeholderTextColor={COLORS.text.light}
                value={form.address}
                onChangeText={(text) => setForm({ ...form, address: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Location Section */}
            <View style={styles.locationSection}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                )}
                <Text style={styles.locationButtonText}>
                  {locationLoading
                    ? "Getting location..."
                    : "Use Current Location"}
                </Text>
              </TouchableOpacity>

              {location && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={{
                      ...location,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                  >
                    <Marker coordinate={location} />
                  </MapView>
                </View>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, updating && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={COLORS.text.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                /* Handle delete account */
              }}
            >
              <Text style={styles.secondaryButtonText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButtonNew}
              onPress={handleLogout}
              disabled={loading}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={COLORS.text.white}
              />
              <Text style={styles.logoutButtonTextNew}>
                {loading ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Toast />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray[100],
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  imageText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  locationButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: "500",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    height: 200,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginVertical: 30,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.white,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  logoutButtonText: {
    color: COLORS.text.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  // Header logout button
  headerLogoutButton: {
    padding: 8,
    marginRight: 12,
  },

  // Settings section styles
  settingsSection: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 16,
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
    fontWeight: "500",
  },

  logoutItem: {
    borderColor: COLORS.error + "20",
    backgroundColor: COLORS.error + "05",
    marginTop: 8,
  },

  logoutText: {
    color: COLORS.error,
    fontWeight: "600",
  },

  // Bottom actions styles
  bottomActions: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  secondaryButtonText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "500",
  },

  logoutButtonNew: {
    flex: 1,
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 2,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  logoutButtonTextNew: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.white,
    marginLeft: 8,
  },
});

