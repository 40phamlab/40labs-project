// [PHASE: MVP]
// [SPEC: apps/core-desktop/CONTEXT/05-LAN-ORBIT.md]
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '@40labs/design-tokens';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.textPrimary,
  className,
}) => {
  return <Ionicons name={name as any} size={size} color={color} className={className} />;
};
