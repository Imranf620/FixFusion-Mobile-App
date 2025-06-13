import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);

  const fetchRequests = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const token = await SecureStore.getItemAsync('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await api(`/admin/repair-requests?${queryParams}`, 'GET', null, token);
      const data = response.data;
      
      if (reset || page === 1) {
        setRequests(data.requests);
      } else {
        setRequests(prev => [...prev, ...data.requests]);
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
    fetchRequests(1, true);
  }, [selectedStatus, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests(1, true);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchRequests(currentPage + 1);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      setSelectedRequest(request);
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/admin/repair-requests/${request._id}`, 'GET', null, token);
      setRequestDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'in_progress': return COLORS.primary;
      case 'completed': return COLORS.success;
      case 'cancelled': return COLORS.error;
      default: return COLORS.gray[400];
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RequestCard = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle} numberOfLines={2}>{request.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.requestDescription} numberOfLines={3}>
        {request.description}
      </Text>
      
      <View style={styles.requestMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="person" size={16} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>
            {request.customerId?.name || 'Unknown Customer'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={16} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>
            {request.location?.address || 'No address'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={16} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>
            {formatDate(request.createdAt)}
          </Text>
        </View>
        {request.acceptedBid && (
          <View style={styles.metaRow}>
            <Ionicons name="cash" size={16} color={COLORS.success} />
            <Text style={[styles.metaText, { color: COLORS.success }]}>
              Rs. {request.acceptedBid.amount}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => handleViewDetails(request)}
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const FilterButton = ({ title, value, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, selected && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, selected && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const DetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Details</Text>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {requestDetails && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Request Information</Text>
                  <Text style={styles.detailTitle}>{requestDetails.request.title}</Text>
                  <Text style={styles.detailDescription}>{requestDetails.request.description}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(requestDetails.request.status) }]}>
                      <Text style={styles.statusText}>
                        {requestDetails.request.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>{formatDate(requestDetails.request.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <Text style={styles.detailValue}>{requestDetails.request.customerId.name}</Text>
                  <Text style={styles.detailValue}>{requestDetails.request.customerId.email}</Text>
                  <Text style={styles.detailValue}>{requestDetails.request.customerId.phone}</Text>
                </View>

                {requestDetails.request.assignedTechnician && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Assigned Technician</Text>
                    <Text style={styles.detailValue}>{requestDetails.request.assignedTechnician.name}</Text>
                    <Text style={styles.detailValue}>{requestDetails.request.assignedTechnician.email}</Text>
                    <Text style={styles.detailValue}>{requestDetails.request.assignedTechnician.phone}</Text>
                  </View>
                )}

                {requestDetails.bids.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Bids ({requestDetails.bids.length})</Text>
                    {requestDetails.bids.map((bid, index) => (
                      <View key={bid._id} style={styles.bidCard}>
                        <View style={styles.bidHeader}>
                          <Text style={styles.bidTechnician}>{bid.technicianId.name}</Text>
                          <Text style={styles.bidAmount}>Rs. {bid.amount}</Text>
                        </View>
                        <Text style={styles.bidMessage}>{bid.message}</Text>
                        <Text style={styles.bidDate}>{formatDate(bid.createdAt)}</Text>
                        {bid.status === 'accepted' && (
                          <View style={styles.acceptedBadge}>
                            <Text style={styles.acceptedText}>ACCEPTED</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {requestDetails.review && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Review</Text>
                    <View style={styles.reviewCard}>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= requestDetails.review.rating ? "star" : "star-outline"}
                            size={20}
                            color={COLORS.warning}
                          />
                        ))}
                        <Text style={styles.ratingText}>({requestDetails.review.rating}/5)</Text>
                      </View>
                      <Text style={styles.reviewComment}>{requestDetails.review.comment}</Text>
                      <Text style={styles.reviewDate}>{formatDate(requestDetails.review.createdAt)}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Repair Requests</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray[500]}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Status:</Text>
          <FilterButton
            title="All"
            value="all"
            selected={selectedStatus === 'all'}
            onPress={() => setSelectedStatus('all')}
          />
          <FilterButton
            title="Pending"
            value="pending"
            selected={selectedStatus === 'pending'}
            onPress={() => setSelectedStatus('pending')}
          />
          <FilterButton
            title="In Progress"
            value="in_progress"
            selected={selectedStatus === 'in_progress'}
            onPress={() => setSelectedStatus('in_progress')}
          />
          <FilterButton
            title="Completed"
            value="completed"
            selected={selectedStatus === 'completed'}
            onPress={() => setSelectedStatus('completed')}
          />
          <FilterButton
            title="Cancelled"
            value="cancelled"
            selected={selectedStatus === 'cancelled'}
            onPress={() => setSelectedStatus('cancelled')}
          />
        </View>
      </ScrollView>

      {/* Requests List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={loadMore}
      >
        {requests.map((request) => (
          <RequestCard key={request._id} request={request} />
        ))}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        )}

        {currentPage < totalPages && !loading && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DetailsModal />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  filterTextActive: {
    color: COLORS.surface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.surface,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  requestMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginLeft: 6,
    flex: 1,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
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
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.gray[600],
    flex: 1,
  },
  bidCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bidTechnician: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  bidMessage: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  bidDate: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  acceptedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  acceptedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  reviewCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginBottom: 4,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
});