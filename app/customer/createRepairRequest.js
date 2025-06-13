// app/customer/create-request.jsx
import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const ISSUE_TYPES = [
  { id: 'screen', title: 'Screen Issues', icon: 'phone-portrait-outline' },
  { id: 'battery', title: 'Battery', icon: 'battery-half-outline' },
  { id: 'charging', title: 'Charging Port', icon: 'flash-outline' },
  { id: 'camera', title: 'Camera', icon: 'camera-outline' },
  { id: 'speaker', title: 'Audio/Speaker', icon: 'volume-high-outline' },
  { id: 'software', title: 'Software', icon: 'settings-outline' },
  { id: 'other', title: 'Other', icon: 'construct-outline' },
];

const URGENCY_LEVELS = [
  { id: 'low', title: 'Low', color: COLORS.success, description: 'Can wait a few days' },
  { id: 'medium', title: 'Medium', color: COLORS.warning, description: 'Within 24-48 hours' },
  { id: 'high', title: 'High', color: COLORS.error, description: 'Urgent - ASAP' },
];

const DEVICE_BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 
  'Oppo', 'Vivo', 'Realme', 'Nothing', 'Other'
];

export default function CreateRepairRequest() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.8607, // Default to Karachi
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deviceInfo: {
      brand: '',
      model: '',
      year: '',
    },
    issueType: params.issueType || '',
    urgency: 'medium',
    preferredBudget: {
      min: '',
      max: '',
    },
    location: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Permission Required', 'Location permission is needed to show your current location on the map.');
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const locationData = {
        coordinates: [location.coords.longitude, location.coords.latitude],
        address: address[0] ? formatAddress(address[0]) : 'Current Location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(locationData);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [location.coords.longitude, location.coords.latitude],
          address: locationData.address
        }
      }));
    } catch (error) {
      console.log('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addressComponent) => {
    const parts = [];
    if (addressComponent.name) parts.push(addressComponent.name);
    if (addressComponent.street) parts.push(addressComponent.street);
    if (addressComponent.district) parts.push(addressComponent.district);
    if (addressComponent.city) parts.push(addressComponent.city);
    return parts.join(', ') || 'Selected Location';
  };

  const onMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      const locationData = {
        latitude,
        longitude,
        coordinates: [longitude, latitude],
        address: address[0] ? formatAddress(address[0]) : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
      
      setSelectedLocation(locationData);
    } catch (error) {
      console.log('Error getting address:', error);
      setSelectedLocation({
        latitude,
        longitude,
        coordinates: [longitude, latitude],
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }
  };

  const confirmLocationSelection = () => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: selectedLocation.coordinates,
          address: selectedLocation.address
        }
      }));
      setShowMapModal(false);
      setSelectedLocation(null);
    }
  };

  const useCurrentLocationOnMap = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } else {
      getCurrentLocation();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.deviceInfo.brand) {
      newErrors.brand = 'Device brand is required';
    }
    
    if (!formData.deviceInfo.model.trim()) {
      newErrors.model = 'Device model is required';
    }
    
    if (!formData.issueType) {
      newErrors.issueType = 'Issue type is required';
    }

    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const requestData = {
        ...formData,
        images: images.map(img => img.uri), // In production, you'd upload these to a server first
        preferredBudget: {
          min: parseFloat(formData.preferredBudget.min) || 0,
          max: parseFloat(formData.preferredBudget.max) || 0,
        }
      };

      const response = await api('/repair-requests', 'POST', requestData, token);
      console.log('res', response)
      
      if (response.data) {
        Alert.alert(
          'Success',
          'Repair request created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.log('error', error)
      Alert.alert('Error', error.message || 'Failed to create repair request');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.slice(0, 5 - prev.length)]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateDeviceInfo = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deviceInfo: { ...prev.deviceInfo, [field]: value }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateBudget = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferredBudget: { ...prev.preferredBudget, [field]: value }
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Repair Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., iPhone 13 Screen Cracked"
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                placeholderTextColor={COLORS.gray[400]}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.gray[400]}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>

          {/* Device Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Brand *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandSelector}>
                {DEVICE_BRANDS.map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[
                      styles.brandChip,
                      formData.deviceInfo.brand === brand && styles.brandChipSelected
                    ]}
                    onPress={() => updateDeviceInfo('brand', brand)}
                  >
                    <Text style={[
                      styles.brandChipText,
                      formData.deviceInfo.brand === brand && styles.brandChipTextSelected
                    ]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={[styles.input, errors.model && styles.inputError]}
                  placeholder="e.g., iPhone 13 Pro"
                  value={formData.deviceInfo.model}
                  onChangeText={(text) => updateDeviceInfo('model', text)}
                  placeholderTextColor={COLORS.gray[400]}
                />
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2023"
                  value={formData.deviceInfo.year}
                  onChangeText={(text) => updateDeviceInfo('year', text)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.gray[400]}
                />
              </View>
            </View>
          </View>

          {/* Issue Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue Type *</Text>
            <View style={styles.issueTypesGrid}>
              {ISSUE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.issueTypeCard,
                    formData.issueType === type.id && styles.issueTypeCardSelected
                  ]}
                  onPress={() => updateFormData('issueType', type.id)}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={24} 
                    color={formData.issueType === type.id ? COLORS.surface : COLORS.primary} 
                  />
                  <Text style={[
                    styles.issueTypeText,
                    formData.issueType === type.id && styles.issueTypeTextSelected
                  ]}>
                    {type.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.issueType && <Text style={styles.errorText}>{errors.issueType}</Text>}
          </View>

          {/* Urgency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Urgency Level</Text>
            {URGENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.urgencyCard,
                  formData.urgency === level.id && styles.urgencyCardSelected
                ]}
                onPress={() => updateFormData('urgency', level.id)}
              >
                <View style={styles.urgencyContent}>
                  <View style={styles.urgencyHeader}>
                    <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
                    <Text style={[
                      styles.urgencyTitle,
                      formData.urgency === level.id && styles.urgencyTitleSelected
                    ]}>
                      {level.title}
                    </Text>
                  </View>
                  <Text style={styles.urgencyDescription}>{level.description}</Text>
                </View>
                {formData.urgency === level.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Budget (Optional)</Text>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Min Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.preferredBudget.min}
                  onChangeText={(text) => updateBudget('min', text)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.gray[400]}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Max Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1000"
                  value={formData.preferredBudget.max}
                  onChangeText={(text) => updateBudget('max', text)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.gray[400]}
                />
              </View>
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images (Optional)</Text>
            <Text style={styles.sectionSubtitle}>Add photos of the damaged device</Text>
            
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>Add Photos</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                )}
                style={styles.imagesList}
              />
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location *</Text>
            <Text style={styles.sectionSubtitle}>Select your location for repair pickup</Text>
            
            <View style={styles.locationButtonsContainer}>
              <TouchableOpacity 
                style={[styles.locationButton, styles.primaryLocationButton]} 
                onPress={getCurrentLocation}
                disabled={loading}
              >
                <Ionicons name="locate-outline" size={20} color={COLORS.surface} />
                <Text style={styles.primaryLocationButtonText}>
                  {loading ? 'Getting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.locationButton, styles.secondaryLocationButton]} 
                onPress={() => setShowMapModal(true)}
              >
                <Ionicons name="map-outline" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryLocationButtonText}>Select on Map</Text>
              </TouchableOpacity>
            </View>

            {formData.location && (
              <View style={styles.selectedLocationCard}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>{formData.location.address}</Text>
                  <Text style={styles.coordinatesText}>
                    {formData.location.coordinates[1].toFixed(6)}, {formData.location.coordinates[0].toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating Request...' : 'Create Repair Request'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Modal */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.mapModalContainer}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.mapHeaderTitle}>Select Location</Text>
              <TouchableOpacity 
                onPress={confirmLocationSelection}
                disabled={!selectedLocation}
              >
                <Text style={[
                  styles.confirmButton,
                  !selectedLocation && styles.confirmButtonDisabled
                ]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>

            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onPress={onMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  description={selectedLocation.address}
                />
              )}
            </MapView>

            <View style={styles.mapControls}>
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={useCurrentLocationOnMap}
              >
                <Ionicons name="locate" size={20} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            {selectedLocation && (
              <View style={styles.selectedLocationInfo}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.selectedLocationText} numberOfLines={2}>
                  {selectedLocation.address}
                </Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    height: 100,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  brandSelector: {
    marginBottom: 8,
  },
  brandChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  brandChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  brandChipText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  brandChipTextSelected: {
    color: COLORS.surface,
  },
  issueTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  issueTypeCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '31%',
    minHeight: 80,
    borderWidth: 2,
    borderColor: COLORS.gray[100],
  },
  issueTypeCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  issueTypeText: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },
  issueTypeTextSelected: {
    color: COLORS.surface,
  },
  urgencyCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.gray[100],
  },
  urgencyCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  urgencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  urgencyTitleSelected: {
    color: COLORS.primary,
  },
  urgencyDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  imagePickerButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imagePickerText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagesList: {
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  locationButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLocationButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryLocationButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryLocationButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  secondaryLocationButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedLocationCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 8,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  submitButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  // Map Modal Styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  confirmButtonDisabled: {
    color: COLORS.gray[300],
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
  currentLocationButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedLocationInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedLocationText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 8,
    flex: 1,
  },
});