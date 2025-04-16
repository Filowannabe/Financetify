import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Icon } from "react-native-paper";
import { HomeScreen } from "./views/Home/HomeScreen";
import { SubscriptionsScreen } from "./views/Subscriptions/SubscriptionsScreen";
import { SettingsScreen } from "./views/Settings/SettingsScreen";
import { useAppTheme } from "./themes";

const Tab = createBottomTabNavigator();

export const IncomesCalculator = () => {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Subscriptions":
              iconName = focused ? "format-list-bulleted" : "format-list-bulleted";
              break;
            case "Settings":
              iconName = focused ? "cog" : "cog-outline";
              break;
            default:
              iconName = "alert";
          }
          return <Icon source={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtitle,
        tabBarStyle: { 
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5, 
          height: 60 
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.text,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: "Home" }}
      />
      <Tab.Screen 
        name="Subscriptions" 
        component={SubscriptionsScreen} 
        options={{ title: "Subscriptions" }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};