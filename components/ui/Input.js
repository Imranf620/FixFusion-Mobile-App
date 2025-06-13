import { COLORS } from '@/constants/Colors';
import { TYPOGRAPHY } from '@/constants/Typography';
import { Eye, EyeOff } from 'lucide-react-native'; // Adjust to your icon library
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  icon,
  showPasswordToggle = false,
  required = false,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && !showPassword ? true : false;

  const getBorderColor = () => {
    if (error) return COLORS.error;
    if (focused) return COLORS.primary;
    return COLORS.border;
  };

  const getBackgroundColor = () => {
    return disabled ? COLORS.gray[50] : COLORS.surface;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <View style={[styles.inputWrapper, { borderColor: getBorderColor(), backgroundColor: getBackgroundColor() }]}>
        {icon && <View style={styles.icon}>{icon}</View>}

        <TextInput
          style={[styles.input, icon && styles.inputWithIcon, showPasswordToggle && styles.inputWithToggle]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          secureTextEntry={inputType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={COLORS.text.secondary}
          {...props}
        />

        {showPasswordToggle && isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggle}
          >
            {showPassword ? <EyeOff size={20} color={COLORS.text.secondary} /> : <Eye size={20} color={COLORS.text.secondary} />}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  required: {
    color: COLORS.error,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
  inputWithToggle: {
    paddingRight: 40,
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  error: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    marginTop: 4,
  },
});
