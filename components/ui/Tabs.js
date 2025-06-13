import { COLORS } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Tabs = ({ tabs, activeTab, onTabChange, variant = 'default' }) => {
  return (
    <View style={[styles.container, variant === 'pills' && styles.pillsContainer, variant === 'underline' && styles.underlineContainer]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              variant === 'pills' && styles.pillsTab,
              isActive && variant === 'pills' && styles.pillsTabActive,
              isActive && variant === 'underline' && styles.underlineTabActive,
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              isActive ? styles.activeText : styles.inactiveText,
              variant === 'pills' && isActive && styles.pillsTabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  pillsContainer: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,  // ~0.75rem
    padding: 4,        // ~0.25rem
  },
  underlineContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12, // ~0.75rem
    paddingHorizontal: 16, // ~1rem
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsTab: {
    borderRadius: 8,  // ~0.5rem
  },
  pillsTabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Android shadow
  },
  underlineTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontWeight: '400',
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  inactiveText: {
    color: COLORS.text.secondary,
  },
  pillsTabTextActive: {
    fontWeight: '600',
  },
});
