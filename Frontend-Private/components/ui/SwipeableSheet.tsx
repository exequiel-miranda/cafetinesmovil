import React, { useEffect, useRef, useMemo } from 'react';
import { 
  View, StyleSheet, Animated, PanResponder, Dimensions, 
  TouchableWithoutFeedback, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | `${number}%`;
  backgroundColor?: string;
  showHandle?: boolean;
  fullHeight?: boolean;
}

export const SwipeableSheet: React.FC<SwipeableSheetProps> = ({ 
  visible, 
  onClose, 
  children, 
  maxHeight = '85%',
  backgroundColor = '#1A1640',
  showHandle = true,
  fullHeight = false
}) => {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(SCREEN_HEIGHT);
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (e, gestureState) => {
        // Only allow swiping down (positive dy) with a small negative buffer for rubber banding
        const clampedDy = Math.max(-20, gestureState.dy);
        panY.setValue(clampedDy);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      }
    }), [panY]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={s.overlay}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View 
            style={[
              s.backdrop, 
              { 
                opacity: panY.interpolate({
                  inputRange: [0, SCREEN_HEIGHT / 2],
                  outputRange: [1, 0],
                  extrapolate: 'clamp'
                }) 
              }
            ]} 
          />
        </TouchableWithoutFeedback>
        <Animated.View 
          style={[
            s.sheet, 
            { 
              backgroundColor,
              maxHeight,
              transform: [{ 
                translateY: panY.interpolate({
                  inputRange: [-100, 0, SCREEN_HEIGHT],
                  outputRange: [0, 0, SCREEN_HEIGHT],
                  extrapolate: 'clamp'
                }) 
              }] 
            },
            fullHeight && { height: maxHeight }
          ]}
        >
          {showHandle && (
            <View {...panResponder.panHandlers} style={s.handleContainer}>
              <View style={s.handle} />
            </View>
          )}
          
          <View style={[s.content, fullHeight && { flex: 1 }]}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,2,18,0.85)' },
  sheet: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    borderTopWidth: 1, 
    borderColor: '#2E2A62',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: { 
    width: '100%', 
    paddingTop: 16, 
    paddingBottom: 8, 
    alignItems: 'center' 
  },
  handle: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#4A4580' 
  },
  content: { flexShrink: 1 }
});
