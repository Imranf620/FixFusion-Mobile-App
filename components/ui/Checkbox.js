import { COLORS } from '@/constants/Colors';
import { TYPOGRAPHY } from '@/constants/Typography';
import { Check } from 'lucide-react-native'; // Make sure you're using the React Native version
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  error = false
}) => {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: error
              ? COLORS.error
              : checked
              ? COLORS.primary
              : COLORS.border,
            backgroundColor: checked ? COLORS.primary : COLORS.surface,
          },
        ]}
      >
        {checked && <Check size={16} color={COLORS.text.white} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 0.75rem ≈ 12px
  },
  checkbox: {
    width: 20, // 1.25rem
    height: 20,
    borderWidth: 2,
    borderRadius: 6, // 0.375rem
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
