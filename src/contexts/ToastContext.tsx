import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);

    // Reset
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);

    // Animate In: Fast Enter (~200ms) with spring
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: insets.top + SPACING.lg,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start(() => {
      // Auto Hide after 1.8s
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ]).start(() => {
          setToastMessage('');
        });
      }, 1800);
    });
  }, [insets.top]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage ? (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim 
            }
          ]}
          pointerEvents="none"
        >
          <View style={[styles.toastInner, toastType === 'error' && styles.toastError, toastType === 'info' && styles.toastInfo]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastInner: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  toastError: {
    backgroundColor: COLORS.error,
  },
  toastInfo: {
    backgroundColor: COLORS.accent,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
