import { COLORS } from '@/constants/Colors';
import useUser from '@/store/userUser';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ChatListScreen = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const fetchChats = async () => {
    if (!user) return;
    
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api('/chat', 'GET', null, token);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
      });
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p.userId._id !== user._id);
  };

  const renderChatItem = ({ item }) => {
    const otherParticipant = getOtherParticipant(item);
    const hasUnreadMessages = item.unreadCount > 0;
    const lastMessageTime = item.lastMessage?.timestamp 
      ? formatTime(item.lastMessage.timestamp)
      : '';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/main/customer/chat/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.chatContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons 
                name="person" 
                size={24} 
                color={COLORS.primary} 
              />
            </View>
            {otherParticipant?.role === 'technician' && (
              <View style={styles.technicianBadge}>
                <Ionicons name="build" size={12} color={COLORS.text.white} />
              </View>
            )}
          </View>

          {/* Chat Info */}
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.participantName} numberOfLines={1}>
                {otherParticipant?.userId.name || 'Unknown User'}
              </Text>
              <Text style={styles.lastMessageTime}>
                {lastMessageTime}
              </Text>
            </View>

            <View style={styles.chatPreview}>
              <View style={styles.repairRequestInfo}>
                <Text style={styles.repairTitle} numberOfLines={1}>
                  {item.repairRequestId.title}
                </Text>
                <Text style={styles.bidAmount}>
                  PKR {item.bidId.amount?.toLocaleString()}
                </Text>
              </View>
            </View>

            {item.lastMessage && (
              <View style={styles.lastMessageContainer}>
                <Text 
                  style={[
                    styles.lastMessage,
                    hasUnreadMessages && styles.unreadMessage
                  ]} 
                  numberOfLines={1}
                >
                  {item.lastMessage.content}
                </Text>
                {hasUnreadMessages && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Bid Status */}
            <View style={styles.bidStatusContainer}>
              <View style={[
                styles.bidStatusBadge,
                item.bidId.status === 'accepted' && styles.acceptedBadge,
                item.bidId.status === 'rejected' && styles.rejectedBadge,
                item.bidId.status === 'pending' && styles.pendingBadge,
              ]}>
                <Text style={styles.bidStatusText}>
                  {item.bidId.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={chats.length === 0 ? styles.emptyListContainer : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Chats Yet</Text>
            <Text style={styles.emptyText}>
              Start negotiating with technicians by messaging them from your bids.
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
  chatItem: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  chatPreview: {
    marginBottom: 6,
  },
  repairRequestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repairTitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.text.light,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bidStatusContainer: {
    alignItems: 'flex-start',
  },
  bidStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: COLORS.gray[200],
  },
  acceptedBadge: {
    backgroundColor: COLORS.success + '20',
  },
  rejectedBadge: {
    backgroundColor: COLORS.error + '20',
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  bidStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatListScreen;