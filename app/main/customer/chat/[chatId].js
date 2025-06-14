import { COLORS } from '@/constants/Colors';
import useUser from '@/store/userUser';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const { chatId } = useLocalSearchParams();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingBid, setProcessingBid] = useState(false);
  const [showBidDetails, setShowBidDetails] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const flatListRef = useRef(null);

  // Fetch chat details
  const fetchChatDetails = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/chat/${chatId}`, 'GET', null, token);
      setChat(response.data);
    } catch (error) {
      console.error('Error fetching chat details:', error);
      Alert.alert('Error', 'Failed to load chat details');
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/chat/${chatId}/messages`, 'GET', null, token);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api(`/chat/${chatId}/messages`, 'POST', {
        content: newMessage.trim(),
        messageType: 'text'
      }, token);

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Accept bid
  const handleAcceptBid = async () => {
    if (!chat?.bidId?._id) return;

    Alert.alert(
      'Accept Bid',
      `Are you sure you want to accept this bid of PKR ${chat.bidId.amount?.toLocaleString()}? This will assign the technician to your repair request.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setProcessingBid(true);
            try {
              const token = await SecureStore.getItemAsync('token');
              await api(`/bid/${chat.bidId._id}/accept`, 'PUT', null, token);
              Alert.alert('Success', 'Bid accepted successfully!');
              await fetchChatDetails(); // Refresh chat details
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to accept bid');
            } finally {
              setProcessingBid(false);
            }
          },
        },
      ]
    );
  };

  // Reject bid
  const handleRejectBid = async () => {
    if (!chat?.bidId?._id) return;

    Alert.alert(
      'Reject Bid',
      'Are you sure you want to reject this bid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingBid(true);
            try {
              const token = await SecureStore.getItemAsync('token');
              await api(`/bid/${chat.bidId._id}/reject`, 'PUT', { 
                reason: 'Not suitable' 
              }, token);
              Alert.alert('Success', 'Bid rejected successfully!');
              await fetchChatDetails(); // Refresh chat details
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to reject bid');
            } finally {
              setProcessingBid(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (chatId) {
      fetchChatDetails();
      fetchMessages();
    }
  }, [chatId]);

  const getOtherParticipant = () => {
    if (!chat) return null;
    return chat.participants.find(p => p.userId._id !== user._id);
  };

  const isCustomer = () => user?.role === 'customer';
  const isTechnician = () => user?.role === 'technician';

  const getBidStatusColor = (status) => {
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId._id === user._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMyMessage && (
          <View style={styles.senderAvatar}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const BidDetailsModal = () => {
    if (!chat?.bidId) return null;

    return (
      <Modal
        visible={showBidDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBidDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bid Details</Text>
            <TouchableOpacity
              onPress={() => setShowBidDetails(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.bidDetailCard}>
              <View style={styles.bidHeader}>
                <Text style={styles.bidTitle}>Repair Request</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getBidStatusColor(chat.bidId.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {chat.bidId.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.repairTitle}>
                {chat.repairRequestId?.title}
              </Text>
              
              {chat.repairRequestId?.deviceInfo && (
                <Text style={styles.deviceInfo}>
                  {chat.repairRequestId.deviceInfo.brand} {chat.repairRequestId.deviceInfo.model}
                </Text>
              )}

              <View style={styles.bidAmountSection}>
                <Text style={styles.bidAmountLabel}>Bid Amount</Text>
                <Text style={styles.bidAmountValue}>
                  PKR {chat.bidId.amount?.toLocaleString()}
                </Text>
              </View>

              {chat.bidId.estimatedTime && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.detailText}>
                    Estimated Time: {chat.bidId.estimatedTime}
                  </Text>
                </View>
              )}

              {chat.bidId.warranty && (
                <View style={styles.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
                  <Text style={styles.detailText}>
                    Warranty: {chat.bidId.warranty}
                  </Text>
                </View>
              )}

              {chat.bidId.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>
                    {chat.bidId.description}
                  </Text>
                </View>
              )}

              {/* Technician Info */}
              {isTechnician() && (
                <View style={styles.customerSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.participantInfo}>
                    <View style={styles.participantAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.participantName}>
                      {getOtherParticipant()?.userId.name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Customer Info */}
              {isCustomer() && (
                <View style={styles.technicianSection}>
                  <Text style={styles.sectionTitle}>Technician Information</Text>
                  <View style={styles.participantInfo}>
                    <View style={styles.participantAvatar}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.participantName}>
                        {getOtherParticipant()?.userId.name}
                      </Text>
                      {getOtherParticipant()?.userId.technicianProfile && (
                        <View style={styles.technicianDetails}>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={COLORS.warning} />
                            <Text style={styles.ratingText}>
                              {getOtherParticipant().userId.technicianProfile.rating || 'N/A'}
                            </Text>
                          </View>
                          <Text style={styles.experienceText}>
                            {getOtherParticipant().userId.technicianProfile.experience || 0} years experience
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action buttons for customer */}
          {isCustomer() && chat.bidId.status === 'pending' && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectBid}
                disabled={processingBid}
              >
                {processingBid ? (
                  <ActivityIndicator size="small" color={COLORS.text.white} />
                ) : (
                  <>
                    <Ionicons name="close" size={18} color={COLORS.text.white} />
                    <Text style={styles.actionButtonText}>Reject Bid</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptBid}
                disabled={processingBid}
              >
                {processingBid ? (
                  <ActivityIndicator size="small" color={COLORS.text.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={COLORS.text.white} />
                    <Text style={styles.actionButtonText}>Accept Bid</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="chatbubble-outline" size={64} color={COLORS.gray[400]} />
        <Text style={styles.errorTitle}>Chat not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {otherParticipant?.userId.name || 'Unknown User'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {chat.repairRequestId?.title}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowBidDetails(true)}
          style={styles.headerButton}
        >
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Bid Status Bar */}
      <View style={styles.bidStatusBar}>
        <View style={styles.bidStatusInfo}>
          <Text style={styles.bidStatusLabel}>Bid Status:</Text>
          <View style={[
            styles.bidStatusBadge,
            { backgroundColor: getBidStatusColor(chat.bidId?.status) }
          ]}>
            <Text style={styles.bidStatusText}>
              {chat.bidId?.status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
        <Text style={styles.bidAmount}>
          PKR {chat.bidId?.amount?.toLocaleString() || '0'}
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubble-outline" size={48} color={COLORS.gray[400]} />
              <Text style={styles.emptyMessagesText}>
                Start the conversation
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.text.light}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.text.white} />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() ? COLORS.text.white : COLORS.text.light} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bid Details Modal */}
      <BidDetailsModal />
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  headerButton: {
    marginLeft: 12,
  },
  bidStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bidStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidStatusLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  bidStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bidStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.white,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    marginLeft: 'auto',
  },
  otherMessageBubble: {
    backgroundColor: COLORS.gray[100],
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.text.white,
  },
  otherMessageText: {
    color: COLORS.text.primary,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: COLORS.text.white + '80',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: COLORS.text.light,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  bidDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bidTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.white,
  },
  repairTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  deviceInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  bidAmountSection: {
    marginBottom: 16,
  },
  bidAmountLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  bidAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  descriptionSection: {
    marginTop: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  customerSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  technicianSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  technicianDetails: {
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
});

export default ChatScreen;