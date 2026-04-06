import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const Avatar = ({ user, size = 40 }: { user?: any; size?: number }) => {
  const [imageError, setImageError] = useState(false);
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
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#ECC94B', fontWeight: 'bold', fontSize: size * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
};
