// app/customer/home.jsx
import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ISSUE_TYPES = [
  { id: 'screen', title: 'Screen Issues', icon: 'phone-portrait-outline' },
  { id: 'battery', title: 'Battery', icon: 'battery-half-outline' },
  { id: 'charging', title: 'Charging Port', icon: 'flash-outline' },
  { id: 'camera', title: 'Camera', icon: 'camera-outline' },
  { id: 'speaker', title: 'Audio/Speaker', icon: 'volume-high-outline' },
  { id: 'software', title: 'Software', icon: 'settings-outline' },
  { id: 'other', title: 'Other', icon: 'construct-outline' },
];

export default function CustomerHome() {
  const [user, setUser] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    activeRequests: 0,
  });

  useEffect(() => {
    loadUserData();
    fetchRecentRequests();
    fetchUserStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api('/repair-requests?limit=5', 'GET', null, token);
      setRecentRequests(response.data.requests || []);
    } catch (error) {
      console.log('Error fetching recent requests:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await api('/repair-requests', 'GET', null, token);
      const requests = response.data.requests || [];
      
      setStats({
        totalRequests: requests.length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        activeRequests: requests.filter(r => ['open', 'bidding', 'assigned', 'in_progress'].includes(r.status)).length,
      });
    } catch (error) {
      console.log('Error fetching user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRecentRequests(), fetchUserStats()]);
    setRefreshing(false);
  };

  const handleCreateRequest = () => {
    router.push('/customer/createRepairRequest');
  };

  const handleIssueTypePress = (issueType) => {
    router.push({
      pathname: '/customer/createRepairRequest',
      params: { issueType: issueType.id }
    });
  };

  const handleRequestPress = (request) => {
    router.push(`/customer/requests/${request._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return COLORS.warning;
      case 'bidding': return COLORS.primary;
      case 'assigned': return COLORS.success;
      case 'in_progress': return COLORS.primary;
      case 'completed': return COLORS.success;
      case 'cancelled': return COLORS.error;
      default: return COLORS.gray[500];
    }
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
            <Text style={styles.subGreeting}>What device needs fixing today?</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search technicians, services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalRequests}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeRequests}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedRequests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRequest}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.surface} />
            <Text style={styles.primaryButtonText}>Create Repair Request</Text>
          </TouchableOpacity>
        </View>

        {/* Issue Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Issues</Text>
          <View style={styles.issueTypesGrid}>
            {ISSUE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.issueTypeCard}
                onPress={() => handleIssueTypePress(type)}
              >
                <View style={styles.issueTypeIcon}>
                  <Ionicons name={type.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.issueTypeText}>{type.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <TouchableOpacity onPress={() => router.push('main/customer/requests')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentRequests.length > 0 ? (
            recentRequests.map((request) => (
              <TouchableOpacity
                key={request._id}
                style={styles.requestCard}
                onPress={() => handleRequestPress(request)}
              >
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {request.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{formatStatus(request.status)}</Text>
                  </View>
                </View>
                <Text style={styles.requestDescription} numberOfLines={2}>
                  {request.description}
                </Text>
                <View style={styles.requestFooter}>
                  <Text style={styles.requestDevice}>
                    {request.deviceInfo?.brand} {request.deviceInfo?.model}
                  </Text>
                  <Text style={styles.requestDate}>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyStateText}>No repair requests yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first repair request to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  subGreeting: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
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
  },
  issueTypeIcon: {
    marginBottom: 8,
  },
  issueTypeText: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '500',
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDevice: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.text.light,
    marginTop: 8,
    textAlign: 'center',
  },
});