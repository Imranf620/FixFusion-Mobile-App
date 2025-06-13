import { COLORS } from '@/constants/Colors';
import React from 'react';
import { View } from 'react-native';


export const Card = ({
  children,
  padding = 'lg',
  shadow = 'md',
  style
}) => {
  const paddings = {
    sm: 16, // 1rem
    md: 24, // 1.5rem
    lg: 32, // 2rem
    xl: 40, // 2.5rem
  };

  const shadows = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.1,
      shadowRadius: 25,
      elevation: 12,
    },
  };

  return (
    <View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: paddings[padding],
        },
        shadows[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
};
