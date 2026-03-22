import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { LunchesScreen } from '../screens/LunchesScreen';
import { SnacksScreen } from '../screens/SnacksScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { CustomTabBar } from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Inicio" component={HomeScreen} />
            <Tab.Screen name="Almuerzos" component={LunchesScreen} />
            <Tab.Screen name="Snacks" component={SnacksScreen} />
            <Tab.Screen name="Pedidos" component={OrdersScreen} />
            <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
    );
};
