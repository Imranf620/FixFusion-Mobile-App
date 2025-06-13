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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [avgRating, setAvgRating] = useState(0);

  const fetchReviews = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const token = await SecureStore.getItemAsync('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(selectedRating !== 'all' && { rating: selectedRating }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await api(`/admin/reviews?${queryParams}`, 'GET', null, token);
      const data = response.data;
      
      if (reset || page === 1) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.pages);
      setAvgRating(data.avgRating);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, true);
  }, [selectedRating, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(1, true);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchReviews(currentPage + 1);
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

  const getRatingColor = (rating) => {
    if (rating >= 4) return COLORS.success;
    if (rating >= 3) return COLORS.warning;
    return COLORS.error;
  };

  const StarRating = ({ rating, size = 16 }) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color={COLORS.warning}
          style={styles.star}
        />
      ))}
    </View>
  );

  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewInfo}>
          <Text style={styles.customerName}>{review.customerId?.name || 'Unknown Customer'}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(review.rating) }]}>
            <Ionicons name="star" size={12} color={COLORS.surface} />
            <Text style={styles.ratingText}>{review.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.reviewContent}>
        <StarRating rating={review.rating} />
        <Text style={styles.reviewComment}>{review.comment}</Text>
      </View>

      <View style={styles.reviewMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="person" size={14} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>
            Technician: {review.technicianId?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="construct" size={14} color={COLORS.gray[500]} />
          <Text style={styles.metaText}>
            Request: {review.repairRequestId?.title || 'N/A'}
          </Text>
        </View>
      </View>

      {review.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Technician Response:</Text>
          <Text style={styles.responseText}>{review.response}</Text>
        </View>
      )}
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

  const StatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{reviews.length}</Text>
        <Text style={styles.statLabel}>Total Reviews</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={styles.avgRatingContainer}>
          <Ionicons name="star" size={20} color={COLORS.warning} />
          <Text style={styles.avgRatingValue}>{avgRating.toFixed(1)}</Text>
        </View>
        <Text style={styles.statLabel}>Average Rating</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
        </Text>
        <Text style={styles.statLabel}>Positive Reviews</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {reviews.length > 0 && <StatsCard />}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reviews..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray[500]}
        />
      </View>

      {/* Rating Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            title="All"
            value="all"
            selected={selectedRating === 'all'}
            onPress={() => setSelectedRating('all')}
          />
          {[5, 4, 3, 2, 1].map((rating) => (
            <FilterButton
              key={rating}
              title={`${rating} Star${rating > 1 ? 's' : ''}`}
              value={rating.toString()}
              selected={selectedRating === rating.toString()}
              onPress={() => setSelectedRating(rating.toString())}
            />
          ))}
        </ScrollView>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.reviewsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {loading && reviews.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Reviews Found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery || selectedRating !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No reviews have been submitted yet'
              }
            </Text>
          </View>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
            
            {/* Load More Button */}
            {currentPage < totalPages && (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={loadMore}
                disabled={loading}
              >
                <Text style={styles.loadMoreText}>
                  {loading ? 'Loading...' : 'Load More Reviews'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    margin: 16,
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  avgRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avgRatingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  reviewsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  reviewContent: {
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    marginRight: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  reviewMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  loadMoreText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});