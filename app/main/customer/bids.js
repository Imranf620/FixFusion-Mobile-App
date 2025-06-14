import { COLORS } from '@/constants/Colors';
import useUser from '@/store/userUser';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const BidsScreen = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingBid, setProcessingBid] = useState(null);
  const { user } = useUser();
  const router = useRouter();

  const fetchBids = async () => {
    if (!user) return;
    
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api('/bid/my-received-bids', 'GET', null, token);
      setBids(response.data.bids);
      console.log('res',response)
    } catch (error) {
      console.error('Error fetching bids:', error);
      Alert.alert('Error', 'Failed to fetch bids');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBids();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBids();
  };

  const handleAcceptBid = async (bidId) => {
    Alert.alert(
      'Accept Bid',
      'Are you sure you want to accept this bid? This will assign the technician to your repair request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setProcessingBid(bidId);
            try {
              const token = await SecureStore.getItemAsync('token');
              await api(`/bid/${bidId}/accept`, 'PUT', null, token);
              Alert.alert('Success', 'Bid accepted successfully!');
              fetchBids();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to accept bid');
            } finally {
              setProcessingBid(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectBid = async (bidId) => {
    Alert.alert(
      'Reject Bid',
      'Are you sure you want to reject this bid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingBid(bidId);
            try {
              const token = await SecureStore.getItemAsync('token');
              await api(`/bid/${bidId}/reject`, 'PUT', { reason: 'Not suitable' }, token);
              Alert.alert('Success', 'Bid rejected successfully!');
              fetchBids();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to reject bid');
            } finally {
              setProcessingBid(null);
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (bid) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const chatData = {
        repairRequestId: bid.repairRequestId._id,
        bidId: bid._id,
        technicianId: bid.technicianId._id,
      };
      
      const response = await api('/chat', 'POST', chatData, token);
      router.push(`/main/customer/chat/${response.data._id}`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start chat');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'accepted':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderBidItem = ({ item }) => (
    <View style={styles.bidCard}>
      <View style={styles.bidHeader}>
        <View style={styles.repairRequestInfo}>
          <Text style={styles.repairTitle} numberOfLines={1}>
            {item.repairRequestId.title}
          </Text>
          <Text style={styles.deviceInfo} numberOfLines={1}>
            {item.repairRequestId.deviceInfo?.brand} {item.repairRequestId.deviceInfo?.model}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color={COLORS.text.white} />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.technicianInfo}>
        <View style={styles.technicianAvatar}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.technicianDetails}>
          <Text style={styles.technicianName}>{item.technicianId.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {item.technicianId.technicianProfile?.rating || 'N/A'}
            </Text>
            <Text style={styles.experienceText}>
              • {item.technicianId.technicianProfile?.experience || 0} yrs exp
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bidDetails}>
        <View style={styles.bidAmount}>
          <Text style={styles.amountLabel}>Bid Amount</Text>
          <Text style={styles.amountValue}>PKR {item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.estimatedTime}>
          <Text style={styles.timeLabel}>Est. Time</Text>
          <Text style={styles.timeValue}>{item.estimatedTime}</Text>
        </View>
      </View>

      {item.description && (
        <View style={styles.description}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}

      {item.warranty && (
        <View style={styles.warranty}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          <Text style={styles.warrantyText}>Warranty: {item.warranty}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.text.white} />
          <Text style={styles.chatButtonText}>Message</Text>
        </TouchableOpacity>

        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectBid(item._id)}
              disabled={processingBid === item._id}
            >
              {processingBid === item._id ? (
                <ActivityIndicator size="small" color={COLORS.text.white} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={COLORS.text.white} />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptBid(item._id)}
              disabled={processingBid === item._id}
            >
              {processingBid === item._id ? (
                <ActivityIndicator size="small" color={COLORS.text.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={COLORS.text.white} />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading bids...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Received Bids</Text>
        <Text style={styles.headerSubtitle}>
          {bids.length} bid{bids.length !== 1 ? 's' : ''} received
        </Text>
      </View>

      <FlatList
        data={bids}
        renderItem={renderBidItem}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Bids Yet</Text>
            <Text style={styles.emptyText}>
              Bids from technicians will appear here when they respond to your repair requests.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  bidCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  repairRequestInfo: {
    flex: 1,
    marginRight: 12,
  },
  repairTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  deviceInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.white,
    marginLeft: 4,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  technicianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bidDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bidAmount: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  estimatedTime: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  description: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  warranty: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warrantyText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  chatButtonText: {
    color: COLORS.text.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.text.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});

export default BidsScreen;