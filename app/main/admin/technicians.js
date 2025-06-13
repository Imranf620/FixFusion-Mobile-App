import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchPendingTechnicians = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/admin/technicians/pending?page=${page}&limit=10`, 'GET', null, token);
      const data = response.data;
      
      if (reset || page === 1) {
        // console.log('data',data)
        setTechnicians(data.technicians);
      } else {
        setTechnicians(prev => [...prev, ...data.technicians]);
      }
      
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingTechnicians(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingTechnicians(1, true);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchPendingTechnicians(currentPage + 1);
    }
  };

  const handleApprovalAction = (technician, approve) => {
    setSelectedTechnician(technician);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const approveTechnician = async (approved) => {
    console.log("selectedTechnician", selectedTechnician)
    if (!selectedTechnician) return;

    try {
      const token = await SecureStore.getItemAsync('token');
      await api(
        `/admin/technicians/${selectedTechnician._id}/approve`,
        'PUT',
        { approved, reason: approvalReason },
        token
      );
      

      setTechnicians(prev =>
        prev.filter(tech => tech._id !== selectedTechnician._id)
      );

      setShowApprovalModal(false);
      setSelectedTechnician(null);
      Alert.alert('Success', `Technician ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
    console.log("selectedTechnician", selectedTechnician)

      Alert.alert('Error', error.message);
    }
  };

  const showTechnicianDetails = (technician) => {
    setSelectedTechnician(technician);
    setShowDetailsModal(true);
  };

  const TechnicianCard = ({ technician }) => (
    <View style={styles.technicianCard}>
      <View style={styles.technicianHeader}>
        <View style={styles.profileSection}>
          {technician.userId.profileImage ? (
            <Image
              source={{ uri: technician.userId.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.gray[500]} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.technicianName}>{technician.userId.name}</Text>
            <Text style={styles.technicianEmail}>{technician.userId.email}</Text>
            <Text style={styles.technicianPhone}>{technician.userId.phone}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => showTechnicianDetails(technician)}
        >
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.specializationContainer}>
        <Text style={styles.sectionLabel}>Specializations:</Text>
        <View style={styles.specializationTags}>
          {technician.specializations.map((spec, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color={COLORS.gray[500]} />
          <Text style={styles.infoText}>{technician.experience} years exp.</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={16} color={COLORS.gray[500]} />
          <Text style={styles.infoText}>PKR {technician.hourlyRate}/hr</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location" size={16} color={COLORS.gray[500]} />
          <Text style={styles.infoText}>{technician.location.city}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {technician.description}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleApprovalAction(technician, false)}
        >
          <Ionicons name="close" size={16} color={COLORS.surface} />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprovalAction(technician, true)}
        >
          <Ionicons name="checkmark" size={16} color={COLORS.surface} />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.appliedDate}>
        Applied: {new Date(technician.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const TechnicianDetailsModal = () => {
    if (!selectedTechnician) return null;
    console.log("tech", selectedTechnician)

    const availableDays = Object.entries(selectedTechnician.workingHours)
      .filter(([_, day]) => day.available)
      .map(([dayName, day]) => `${dayName}: ${day.hours}`)
      .join('\n');

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>Technician Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Personal Information</Text>
                <Text style={styles.detailText}>Name: {selectedTechnician.userId.name}</Text>
                <Text style={styles.detailText}>Email: {selectedTechnician.userId.email}</Text>
                <Text style={styles.detailText}>Phone: {selectedTechnician.userId.phone}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Professional Information</Text>
                <Text style={styles.detailText}>Experience: {selectedTechnician.experience} years</Text>
                <Text style={styles.detailText}>Hourly Rate: PKR {selectedTechnician.hourlyRate}</Text>
                <Text style={styles.detailText}>Service Radius: {selectedTechnician.serviceRadius} km</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Location</Text>
                <Text style={styles.detailText}>Address: {selectedTechnician.location.address}</Text>
                <Text style={styles.detailText}>City: {selectedTechnician.location.city}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Description</Text>
                <Text style={styles.detailText}>{selectedTechnician.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Availability</Text>
                <Text style={styles.detailText}>{availableDays || 'No availability set'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Specializations</Text>
                <View style={styles.specializationTags}>
                  {selectedTechnician.specializations.map((spec, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Technicians</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={loadMore}
      >
        {technicians.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.emptyText}>No pending technicians</Text>
            <Text style={styles.emptySubtext}>All technician applications have been reviewed</Text>
          </View>
        ) : (
          technicians.map((technician) => (
            <TechnicianCard key={technician._id} technician={technician} />
          ))
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading technicians...</Text>
          </View>
        )}

        {currentPage < totalPages && !loading && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedTechnician ? 'Approve Technician' : 'Reject Technician'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedTechnician?.userId.name} ({selectedTechnician?.userId.email})
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reason (optional):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter reason..."
                value={approvalReason}
                onChangeText={setApprovalReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => approveTechnician(false)}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton]}
                onPress={() => approveTechnician(true)}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TechnicianDetailsModal />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  technicianCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  technicianEmail: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  technicianPhone: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  detailsButton: {
    padding: 4,
  },
  specializationContainer: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  specializationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  appliedDate: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  detailsModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: '95%',
    maxHeight: '80%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailsContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginBottom: 4,
    lineHeight: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
});