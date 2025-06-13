import LoadingOverlay from '@/components/LoadingOverlay';
import { COLORS } from '@/constants/Colors';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      
      const token = await SecureStore.getItemAsync('token');
      const response = await api('/admin/dashboard', 'GET', null, token);
      setStats(response.data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const StatCard = ({ title, value, icon, color = COLORS.primary, subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value.toLocaleString()}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const RecentItem = ({ title, subtitle, time, status }) => (
    <View style={styles.recentItem}>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
        <Text style={styles.recentTime}>{new Date(time).toLocaleDateString()}</Text>
      </View>
      {status && (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'in_progress': return COLORS.primary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.gray[400];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={(stats?.overview.totalCustomers || 0) + (stats?.overview.totalTechnicians || 0)}
            icon="people"
            color={COLORS.primary}
          />
          <StatCard
            title="Customers"
            value={stats?.overview.totalCustomers || 0}
            icon="person"
            color={COLORS.success}
          />
          <StatCard
            title="Technicians"
            value={stats?.overview.totalTechnicians || 0}
            icon="construct"
            color={COLORS.warning}
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.overview.pendingTechnicians || 0}
            icon="time"
            color={COLORS.error}
          />
          <StatCard
            title="Total Requests"
            value={stats?.overview.totalRepairRequests || 0}
            icon="clipboard"
            color={COLORS.primary}
          />
          <StatCard
            title="Completed Repairs"
            value={stats?.overview.completedRepairs || 0}
            icon="checkmark-circle"
            color={COLORS.success}
          />
          <StatCard
            title="Total Bids"
            value={stats?.overview.totalBids || 0}
            icon="pricetag"
            color={COLORS.warning}
          />
          <StatCard
            title="Reviews"
            value={stats?.overview.totalReviews || 0}
            icon="star"
            color={COLORS.primary}
          />
        </View>

        {/* Monthly Stats */}
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="New Users"
            value={stats?.monthly.newUsers || 0}
            icon="person-add"
            color={COLORS.success}
          />
          <StatCard
            title="New Requests"
            value={stats?.monthly.newRequests || 0}
            icon="add-circle"
            color={COLORS.primary}
          />
          <StatCard
            title="Completed"
            value={stats?.monthly.completedRepairs || 0}
            icon="checkmark-done"
            color={COLORS.success}
          />
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Users</Text>
        <View style={styles.recentSection}>
          {stats?.recent.users.map((user) => (
            <RecentItem
              key={user._id}
              title={user.name}
              subtitle={`${user.email} • ${user.role}`}
              time={user.createdAt}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Requests</Text>
        <View style={styles.recentSection}>
          {stats?.recent.repairRequests.map((request) => (
            <RecentItem
              key={request._id}
              title={request.title}
              subtitle={`${request.customerId.name} • ${request.customerId.email}`}
              time={request.createdAt}
              status={request.status}
            />
          ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recentSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  recentTime: {
    fontSize: 12,
    color: COLORS.gray[500],
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
    textTransform: 'capitalize',
  },
});