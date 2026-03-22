import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;

const TabBarIcon = ({ isFocused, options, onTabPress, routeName }) => {
    // slideAnim pushes the active blue circle up into the curve
    const slideAnim = React.useRef(new Animated.Value(isFocused ? -25 : 0)).current;
    // fadeAnim controls the text opacity fading in
    const fadeAnim = React.useRef(new Animated.Value(isFocused ? 0 : 1)).current;
    
    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: isFocused ? -30 : 0, 
                useNativeDriver: true,
                tension: 60,
                friction: 8,
            }),
            Animated.timing(fadeAnim, {
                toValue: isFocused ? 0 : 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, [isFocused]);

    let iconName;
    switch (routeName) {
        case 'Inicio': iconName = isFocused ? 'home' : 'home-outline'; break;
        case 'Almuerzos': iconName = isFocused ? 'restaurant' : 'restaurant-outline'; break;
        case 'Snacks': iconName = isFocused ? 'fast-food' : 'fast-food-outline'; break;
        case 'Pedidos': iconName = isFocused ? 'receipt' : 'receipt-outline'; break;
        case 'Perfil': iconName = isFocused ? 'person' : 'person-outline'; break;
        default: iconName = 'ellipse';
    }

    return (
        <TouchableOpacity 
            activeOpacity={1}
            onPress={onTabPress} 
            style={styles.tabButton}
        >
            <Animated.View style={[
                styles.iconContainer,
                isFocused && styles.iconContainerFocused,
                { transform: [{ translateY: slideAnim }] }
            ]}>
                <Ionicons name={iconName} size={24} color={isFocused ? "#FFFFFF" : "#A0AEC0"} />
            </Animated.View>
            
            <Animated.Text style={[
                styles.tabText, 
                isFocused && styles.tabTextFocused,
                { opacity: fadeAnim }
            ]}>
                {routeName}
            </Animated.Text>
        </TouchableOpacity>
    );
};

export const CustomTabBar = ({ state, descriptors, navigation }) => {
    const tabWidth = width / state.routes.length;
    
    const getPath = () => {
        const activeIndex = state.index;
        const cx = activeIndex * tabWidth + tabWidth / 2;
        const R = 35; // depth of the curve (how far down it goes)
        const curveWidth = 45; // width of curve on each side from the center

        return `
            M 0 0
            L ${cx - curveWidth} 0
            C ${cx - curveWidth / 2} 0, ${cx - curveWidth / 2} ${R}, ${cx} ${R}
            C ${cx + curveWidth / 2} ${R}, ${cx + curveWidth / 2} 0, ${cx + curveWidth} 0
            L ${width} 0
            L ${width} ${TAB_BAR_HEIGHT}
            L 0 ${TAB_BAR_HEIGHT}
            Z
        `;
    };

    return (
        <View style={styles.container}>
            <View style={styles.svgContainer}>
                <Svg width={width} height={TAB_BAR_HEIGHT} style={styles.shadow}>
                    <Path
                        d={getPath()}
                        fill="#1A202C" // Dark grey/black matching the image design
                    />
                </Svg>
            </View>
            
            <View style={styles.tabsContainer}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const { options } = descriptors[route.key];

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TabBarIcon 
                            key={route.key}
                            isFocused={isFocused}
                            options={options}
                            onTabPress={onPress}
                            routeName={route.name}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: TAB_BAR_HEIGHT + 35, // Give extra height so the floating icon doesn't clip
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    svgContainer: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: TAB_BAR_HEIGHT,
    },
    shadow: {
        // SVG styling
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10, 
    },
    tabsContainer: {
        flexDirection: 'row',
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
        paddingBottom: 5, // shift tabs slightly up to make room for text at bottom
    },
    tabButton: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'transparent',
    },
    iconContainerFocused: {
        backgroundColor: '#3B82F6', // iOS Blue color
        // Blue shadow
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    tabText: {
        position: 'absolute',
        bottom: 5,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#A0AEC0',
    },
    tabTextFocused: {
        color: '#3B82F6', // Match the text with the active color theme
    }
});
