import { COLORS } from '@/constants/Colors';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onPress,
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.gray[300];
    if (variant === 'primary') return COLORS.primary;
    if (variant === 'secondary') return 'transparent';
    if (variant === 'ghost') return 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'secondary') return COLORS.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'primary') return COLORS.text.white;
    if (variant === 'secondary') return COLORS.primary;
    if (variant === 'ghost') return COLORS.text.secondary;
  };

  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      height: 32,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      height: 44,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      height: 52,
    },
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'secondary' ? 2 : 0,
      borderColor: getBorderColor(),
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
    //   height: sizeStyles[size].height,
      paddingHorizontal: sizeStyles[size].paddingHorizontal,
      paddingVertical: sizeStyles[size].paddingVertical,
    },
    text: {
      color: getTextColor(),
      fontWeight: '600',
      fontSize: sizeStyles[size].fontSize,
    },
    spinner: {
      marginRight: 8,
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.spinner}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={styles.text}>{children}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};
