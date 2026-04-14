import React from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export default function Logo({ size = 100, style, imageStyle }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 4,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
