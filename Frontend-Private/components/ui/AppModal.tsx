import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, PanResponder, Dimensions, TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.18)',
  teal:       '#00D2A3',
  tealDim:    'rgba(0,210,163,0.15)',
  amber:      '#FFB038',
  amberDim:   'rgba(255,176,56,0.15)',
  rose:       '#FF6B8A',
  roseDim:    'rgba(255,107,138,0.15)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
};

export interface AppModalAction {
  label: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'danger' | 'amber' | 'teal' | 'outline';
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  type?: 'info' | 'success' | 'error' | 'confirm';
  actions?: AppModalAction[];
  centered?: boolean;
  children?: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible, onClose, title, message, icon, type = 'info', actions = [], children, centered = false
}) => {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      panY.setValue(SCREEN_HEIGHT);
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 10,
      }).start();
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, gs) => Math.abs(gs.dy) > 10,
      onPanResponderMove: (e, gs) => {
        const dy = Math.max(-20, gs.dy);
        panY.setValue(dy);
      },
      onPanResponderRelease: (e, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
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

  if (!showModal) return null;

  const getIconColor = () => {
    switch (type) {
      case 'success': return C.teal;
      case 'error': return C.rose;
      case 'confirm': return C.amber;
      default: return C.purple;
    }
  };

  const getIconName = (): keyof typeof MaterialIcons.glyphMap => {
    if (icon) return icon;
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'confirm': return 'help-outline';
      default: return 'info';
    }
  };

  return (
    <Modal visible={showModal} transparent animationType="none">
      <View style={[s.overlay, centered && s.overlayCentered]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[s.blurBg, { 
            opacity: panY.interpolate({ 
              inputRange: [0, SCREEN_HEIGHT / 2], 
              outputRange: [1, 0], 
              extrapolate: 'clamp' 
            }) 
          }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          s.card,
          centered && s.cardCentered,
          { 
            opacity: panY.interpolate({
              inputRange: [0, SCREEN_HEIGHT / 3],
              outputRange: [1, 0],
              extrapolate: 'clamp'
            }),
            transform: [
              { 
                translateY: centered ? 0 : panY.interpolate({
                  inputRange: [-100, 0, SCREEN_HEIGHT],
                  outputRange: [0, 0, SCREEN_HEIGHT],
                  extrapolate: 'clamp'
                }) 
              },
              {
                scale: centered ? panY.interpolate({
                  inputRange: [0, SCREEN_HEIGHT / 3],
                  outputRange: [1, 0.8],
                  extrapolate: 'clamp'
                }) : 1
              }
            ] 
          }
        ]}>
          {!centered && (
            <View {...panResponder.panHandlers} style={s.handleContainer}>
              <View style={s.handle} />
            </View>
          )}

          <View style={[s.header, centered && { marginTop: 24 }]}>
            <View style={[s.iconBox, { backgroundColor: getIconColor() + '20' }]}>
              <MaterialIcons name={getIconName()} size={30} color={getIconColor()} />
            </View>
            <Text style={s.title}>{title}</Text>
          </View>

          <View style={s.body}>
            <Text style={s.message}>{message}</Text>
            {children}
          </View>

          <View style={s.footer}>
            <View style={[s.actionWrap, actions.length > 2 && { flexDirection: 'column' }]}>
                {actions.map((btn, idx) => {
                  const isOutline = btn.type === 'outline';
                  const isSecondary = btn.type === 'secondary';
                  
                  let colors: [string, string] = [C.purple, C.purpleLight];
                  if (btn.type === 'teal') colors = [C.teal, '#00BFA5'];
                  if (btn.type === 'amber') colors = [C.amber, '#FF9100'];
                  if (btn.type === 'danger') colors = [C.rose, '#FF5252'];

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={btn.onPress}
                    activeOpacity={0.8}
                    style={[s.btn, { flex: actions.length > 2 ? 0 : 1 }]}
                  >
                    {isOutline || isSecondary ? (
                      <View style={[s.btnSimple, isOutline && s.btnOutline]}>
                        <Text style={[s.btnTextSimple, isOutline && { color: C.purple }]}>
                          {btn.label}
                        </Text>
                      </View>
                    ) : (
                      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGradient}>
                        <Text style={s.btnText}>{btn.label}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', zIndex: 1000 },
  overlayCentered: { justifyContent: 'center', paddingHorizontal: 32 },
  blurBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,2,18,0.85)' },
  card: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 24,
  },
  cardCentered: {
    borderRadius: 28,
    borderWidth: 1,
    paddingBottom: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  handleContainer: { width: '100%', paddingVertical: 16, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.textMut },
  header: { alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: C.textPri, textAlign: 'center', letterSpacing: 0.5 },
  body: { marginBottom: 24, gap: 10 },
  message: { fontSize: 15, lineHeight: 22, color: C.textSec, textAlign: 'center', fontWeight: '500' },
  footer: { gap: 10 },
  actionWrap: { flexDirection: 'row', gap: 10 },
  btn: { borderRadius: 18, overflow: 'hidden' },
  btnGradient: { paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  btnSimple: { paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1, borderColor: C.purple, backgroundColor: 'transparent' },
  btnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3, color: '#fff' },
  btnTextSimple: { fontSize: 15, fontWeight: '700', color: C.textSec },
});
