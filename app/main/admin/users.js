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


export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusReason, setStatusReason] = useState('');

  const fetchUsers = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const token = await SecureStore.getItemAsync('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await api(`/admin/users?${queryParams}`, 'GET', null, token);
      const data = response.data;
      
      if (reset || page === 1) {
        setUsers(data.users);
      } else {
        setUsers(prev => [...prev, ...data.users]);
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
    fetchUsers(1, true);
  }, [selectedRole, selectedStatus, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, true);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchUsers(currentPage + 1);
    }
  };

  const handleStatusChange = (user) => {
    setSelectedUser(user);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const updateUserStatus = async (isActive) => {
    if (!selectedUser) return;

    try {
      const token = await SecureStore.getItemAsync('token');
      await api(
        `/admin/users/${selectedUser._id}/status`,
        'PUT',
        { isActive, reason: statusReason },
        token
      );

      setUsers(prev =>
        prev.map(user =>
          user._id === selectedUser._id ? { ...user, isActive } : user
        )
      );

      setShowStatusModal(false);
      setSelectedUser(null);
      Alert.alert('Success', `User ${isActive ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: user.isActive ? COLORS.success : COLORS.error }]}>
            <Text style={styles.statusText}>{user.isActive ? 'Active' : 'Suspended'}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
          <Text style={styles.joinDate}>
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: user.isActive ? COLORS.error : COLORS.success }]}
        onPress={() => handleStatusChange(user)}
      >
        <Ionicons
          name={user.isActive ? 'ban' : 'checkmark-circle'}
          size={20}
          color={COLORS.surface}
        />
        <Text style={styles.actionButtonText}>
          {user.isActive ? 'Suspend' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'customer': return COLORS.primary;
      case 'technician': return COLORS.warning;
      case 'admin': return COLORS.error;
      default: return COLORS.gray[400];
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray[500]}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Role:</Text>
          <FilterButton
            title="All"
            value="all"
            selected={selectedRole === 'all'}
            onPress={() => setSelectedRole('all')}
          />
          <FilterButton
            title="Customer"
            value="customer"
            selected={selectedRole === 'customer'}
            onPress={() => setSelectedRole('customer')}
          />
          <FilterButton
            title="Technician"
            value="technician"
            selected={selectedRole === 'technician'}
            onPress={() => setSelectedRole('technician')}
          />
          
          <Text style={[styles.filterLabel, { marginLeft: 16 }]}>Status:</Text>
          <FilterButton
            title="All"
            value="all"
            selected={selectedStatus === 'all'}
            onPress={() => setSelectedStatus('all')}
          />
          <FilterButton
            title="Active"
            value="active"
            selected={selectedStatus === 'active'}
            onPress={() => setSelectedStatus('active')}
          />
          <FilterButton
            title="Suspended"
            value="suspended"
            selected={selectedStatus === 'suspended'}
            onPress={() => setSelectedStatus('suspended')}
          />
        </View>
      </ScrollView>

      {/* Users List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={loadMore}
      >
        {users.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        )}

        {currentPage < totalPages && !loading && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedUser?.isActive ? 'Suspend User' : 'Activate User'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.name} ({selectedUser?.email})
            </Text>

            {selectedUser?.isActive && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reason for suspension:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason..."
                  value={statusReason}
                  onChangeText={setStatusReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => updateUserStatus(!selectedUser?.isActive)}
              >
                <Text style={styles.confirmButtonText}>
                  {selectedUser?.isActive ? 'Suspend' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    textTransform: 'capitalize',
  },
  joinDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
    gap: 12,
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
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  }})