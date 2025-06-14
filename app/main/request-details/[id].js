// app/customer/request-details/[id].jsx
import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const ISSUE_TYPE_ICONS = {
  screen: 'phone-portrait-outline',
  battery: 'battery-half-outline',
  charging: 'flash-outline',
  camera: 'camera-outline',
  speaker: 'volume-high-outline',
  software: 'settings-outline',
  other: 'construct-outline',
};

const STATUS_COLORS = {
  open: COLORS.primary,
  bidding: COLORS.warning,
  assigned: COLORS.info,
  in_progress: COLORS.secondary,
  completed: COLORS.success,
  cancelled: COLORS.error,
};

const URGENCY_COLORS = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.error,
};

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/repair-requests/${id}`, 'GET', null, token);
      
      if (response.data) {
        setRequest(response.data);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      Alert.alert('Error', 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = () => {
    // Only allow editing if status is open or bidding
    if (request.status === 'open' || request.status === 'bidding') {
      router.push(`/customer/edit-request/${request._id}`);
    } else {
      Alert.alert('Cannot Edit', 'This request cannot be edited as it has been assigned or completed.');
    }
  };

  const handleDeleteRequest = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this repair request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');
              await api(`/repair-requests/${id}`, 'DELETE', null, token);
              
              Alert.alert('Success', 'Repair request deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const handleViewBids = () => {
    router.push(`/customer/bids/${request._id}`);
  };

  const handleContactTechnician = () => {
    if (request.assignedTechnician) {
      // Navigate to chat with technician
      router.push(`/customer/chat/${request.assignedTechnician._id}`);
    }
  };

  const handleCallTechnician = () => {
    if (request.assignedTechnician?.phone) {
      Linking.openURL(`tel:${request.assignedTechnician.phone}`);
    }
  };

  const openMapsLocation = () => {
    if (request.location?.coordinates) {
      const [longitude, latitude] = request.location.coordinates;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const canEditOrDelete = () => {
    return request.status === 'open' || request.status === 'bidding';
  };

  const getStatusInfo = (status) => {
    const statusTexts = {
      open: 'Waiting for technicians to bid',
      bidding: 'Receiving bids from technicians',
      assigned: 'Assigned to a technician',
      in_progress: 'Repair is in progress',
      completed: 'Repair has been completed',
      cancelled: 'Request has been cancelled',
    };

    return {
      text: statusTexts[status] || status,
      color: STATUS_COLORS[status] || COLORS.gray[500],
    };
  };

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(request.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={styles.headerActions}>
          {canEditOrDelete() && (
            <>
              <TouchableOpacity style={styles.headerAction} onPress={handleEditRequest}>
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction} onPress={handleDeleteRequest}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.statusDescription}>{statusInfo.text}</Text>
        </View>

        {/* Main Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name={ISSUE_TYPE_ICONS[request.issueType] || 'construct-outline'}
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>{request.title}</Text>
          </View>
          
          <View style={styles.urgencyContainer}>
            <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[request.urgency] }]} />
            <Text style={styles.urgencyText}>{request.urgency.toUpperCase()} PRIORITY</Text>
          </View>

          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.dateText}>Created: {formatDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Brand:</Text>
              <Text style={styles.deviceValue}>{request.deviceInfo.brand}</Text>
            </View>
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Model:</Text>
              <Text style={styles.deviceValue}>{request.deviceInfo.model}</Text>
            </View>
            {request.deviceInfo.color && (
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Color:</Text>
                <Text style={styles.deviceValue}>{request.deviceInfo.color}</Text>
              </View>
            )}
            {request.deviceInfo.purchaseYear && (
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Purchase Year:</Text>
                <Text style={styles.deviceValue}>{request.deviceInfo.purchaseYear}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Budget Information */}
        {request.preferredBudget && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Information</Text>
            <View style={styles.budgetCard}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Min Budget:</Text>
                <Text style={styles.budgetValue}>
                  {formatCurrency(request.preferredBudget.min)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Max Budget:</Text>
                <Text style={styles.budgetValue}>
                  {formatCurrency(request.preferredBudget.max)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Images */}
        {request.images && request.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {request.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageWrapper}
                  onPress={() => openImageModal(index)}
                >
                  <Image
                    source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${image.url}` }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location */}
        {request.location && (
          <View style={styles.section}>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity onPress={openMapsLocation} style={styles.openMapsButton}>
                <Ionicons name="map-outline" size={16} color={COLORS.primary} />
                <Text style={styles.openMapsText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
            
            {request.location.address && (
              <Text style={styles.addressText}>{request.location.address}</Text>
            )}
            
            {request.location.coordinates && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: request.location.coordinates[1],
                    longitude: request.location.coordinates[0],
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: request.location.coordinates[1],
                      longitude: request.location.coordinates[0],
                    }}
                    title="Repair Location"
                  />
                </MapView>
              </View>
            )}
          </View>
        )}

        {/* Assigned Technician */}
        {request.assignedTechnician && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Technician</Text>
            <View style={styles.technicianCard}>
              <View style={styles.technicianInfo}>
                <Text style={styles.technicianName}>{request.assignedTechnician.name}</Text>
                <Text style={styles.technicianEmail}>{request.assignedTechnician.email}</Text>
              </View>
              <View style={styles.technicianActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleContactTechnician}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCallTechnician}
                >
                  <Ionicons name="call-outline" size={20} color={COLORS.success} />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {request.status === 'bidding' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewBids}>
              <Ionicons name="eye-outline" size={20} color={COLORS.text.white} />
              <Text style={styles.primaryButtonText}>View Bids</Text>
            </TouchableOpacity>
          )}
          
          {request.status === 'completed' && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="star-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Rate & Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color={COLORS.text.white} />
          </TouchableOpacity>
          
          {request.images && request.images[selectedImageIndex] && (
            <Image
              source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${request.images[selectedImageIndex].url}` }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
          
          {request.images && request.images.length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setSelectedImageIndex(prev => 
                  prev > 0 ? prev - 1 : request.images.length - 1
                )}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.text.white} />
              </TouchableOpacity>
              
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {request.images.length}
              </Text>
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setSelectedImageIndex(prev => 
                  prev < request.images.length - 1 ? prev + 1 : 0
                )}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  deviceCard: {
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  deviceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  deviceValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  budgetCard: {
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  budgetLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  openMapsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  technicianCard: {
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  technicianEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  technicianActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: COLORS.text.primary,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: width - 40,
    height: height - 200,
  },
  imageNavigation: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navButton: {
    padding: 8,
  },
  imageCounter: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 20,
  },
});