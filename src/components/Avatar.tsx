import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  user?: any;
  size?: number;
}

export const AppAvatar = ({ user, size = 40 }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  
  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(user?.name);

  if (user?.profileImage && !imageError) {
    return (
      <Image
        key={user.profileImage}
        source={{ uri: user.profileImage }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#2D3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ECC94B',
    fontWeight: 'bold',
  },
});
