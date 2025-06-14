// app/customer/requests.jsx
import { COLORS } from "@/constants/Colors";
import { api } from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const STATUS_FILTERS = [
  { id: "all", title: "All", color: COLORS.gray[500] },
  { id: "open", title: "Open", color: COLORS.primary },
  { id: "bidding", title: "Bidding", color: COLORS.warning },
  { id: "assigned", title: "Assigned", color: COLORS.info },
  { id: "in_progress", title: "In Progress", color: COLORS.secondary },
  { id: "completed", title: "Completed", color: COLORS.success },
  { id: "cancelled", title: "Cancelled", color: COLORS.error },
];

const ISSUE_TYPE_ICONS = {
  screen: "phone-portrait-outline",
  battery: "battery-half-outline",
  charging: "flash-outline",
  camera: "camera-outline",
  speaker: "volume-high-outline",
  software: "settings-outline",
  other: "construct-outline",
};

const URGENCY_COLORS = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.error,
};

export default function RequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const fetchRequests = async (
    pageNum = 1,
    statusFilter = selectedFilter,
    refresh = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const token = await SecureStore.getItemAsync("token");
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const response = await api(
        `/repair-requests?${queryParams}`,
        "GET",
        null,
        token
      );
      console.log("res", response);

      if (response.data) {
        const newRequests = response.data.requests || [];

        if (pageNum === 1) {
          setRequests(newRequests);
        } else {
          setRequests((prev) => [...prev, ...newRequests]);
        }

        setHasMoreData(newRequests.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to fetch repair requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests(1, selectedFilter);
    }, [selectedFilter])
  );

  const onRefresh = () => {
    fetchRequests(1, selectedFilter, true);
  };

  const loadMore = () => {
    if (!loading && hasMoreData) {
      fetchRequests(page + 1, selectedFilter);
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setPage(1);
    setHasMoreData(true);
  };

  const handleRequestPress = (request) => {
    router.push(`/main/request-details/${request._id}`);
  };

  const handleCreateRequest = () => {
    router.push("/customer/createRepairRequest");
  };

  const deleteRequest = async (requestId) => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this repair request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("token");
              await api(`/repair-requests/${requestId}`, "DELETE", null, token);

              // Remove from local state
              setRequests((prev) =>
                prev.filter((req) => req._id !== requestId)
              );
              Alert.alert("Success", "Repair request deleted successfully");
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete request");
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeStyle = (status) => {
    const statusConfig = STATUS_FILTERS.find((s) => s.id === status);
    return {
      backgroundColor: statusConfig
        ? statusConfig.color + "20"
        : COLORS.gray[100],
      borderColor: statusConfig ? statusConfig.color : COLORS.gray[300],
    };
  };

  const getStatusTextStyle = (status) => {
    const statusConfig = STATUS_FILTERS.find((s) => s.id === status);
    return {
      color: statusConfig ? statusConfig.color : COLORS.gray[600],
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canDeleteRequest = (request) => {
    return request.status === "open" || request.status === "bidding";
  };

  const renderRequestCard = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons
            name={ISSUE_TYPE_ICONS[item.issueType] || "construct-outline"}
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.requestTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
              {item.status.replace("_", " ")}
            </Text>
          </View>

          {canDeleteRequest(item) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteRequest(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceText}>
          {`${item.deviceInfo?.brand ?? ""} ${item.deviceInfo?.model ?? ""}`}
        </Text>

        {item.deviceInfo.purchaseYear && (
          <Text style={styles.yearText}>• {item.deviceInfo.purchaseYear}</Text>
        )}
      </View>

      {item.images && item.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {item.images.slice(0, 3).map((image, index) => (
            <Image
              key={index}
              source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${image.url}` }}
              style={styles.requestImage}
            />
          ))}
          {item.images.length > 3 && (
            <View style={styles.moreImagesIndicator}>
              <Text style={styles.moreImagesText}>
                +{item.images.length - 3}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.urgencyDot,
              { backgroundColor: URGENCY_COLORS[item.urgency] },
            ]}
          />
          <Text style={styles.urgencyText}>{item.urgency} priority</Text>

          {item.preferredBudget &&
            (item.preferredBudget.min || item.preferredBudget.max) && (
              <>
                <Text style={styles.budgetSeparator}>•</Text>
                <Text style={styles.budgetText}>
                  ${String(item.preferredBudget?.min ?? 0)} - $
                  {String(item.preferredBudget?.max ?? "N/A")}
                </Text>
              </>
            )}
        </View>

        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>

      {item.location && (
        <View style={styles.locationContainer}>
          <Ionicons
            name="location-outline"
            size={14}
            color={COLORS.gray[500]}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location.address}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No Repair Requests</Text>
      <Text style={styles.emptyDescription}>
        {selectedFilter === "all"
          ? "You haven't created any repair requests yet"
          : `No ${selectedFilter.replace("_", " ")} requests found`}
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={handleCreateRequest}
      >
        <Text style={styles.createFirstButtonText}>
          Create Your First Request
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;

    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateRequest}
        >
          <Ionicons name="add" size={20} color={COLORS.surface} />
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipSelected,
              selectedFilter === filter.id && { borderColor: filter.color },
            ]}
            onPress={() => handleFilterChange(filter.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextSelected,
                selectedFilter === filter.id && { color: filter.color },
              ]}
            >
              {filter.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={
          requests.length === 0 ? styles.listEmpty : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  filtersContainer: {
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterChipSelected: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  filterChipTextSelected: {
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deviceText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  yearText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  imagesContainer: {
    marginBottom: 12,
  },
  requestImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImagesIndicator: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.secondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: "capitalize",
  },
  budgetSeparator: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginHorizontal: 6,
  },
  budgetText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createFirstButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
