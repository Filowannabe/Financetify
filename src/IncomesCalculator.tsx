import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Icon } from "react-native-paper";
import { HomeScreen } from "./views/Home/HomeScreen";
import { SettingsScreen } from "./views/Settings/SettingsScreen";
import { useAppTheme } from "./themes";
import { createStackNavigator } from "@react-navigation/stack";
import { ListScreen } from "./views/Subscriptions/ListScreen";
import { FormScreen } from "./views/Subscriptions/FormScreen";
import type { AppStackParamList, RootTabParamList } from "./types/navigation";

// ░▒▓ Stack para SubscriptionsList ▓▒░
const SubscriptionStack = createStackNavigator<AppStackParamList>();

const SubscriptionNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <SubscriptionStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
        },
        headerTitleAlign: "center",
      }}
    >
      <SubscriptionStack.Screen
        name="List"
        component={ListScreen}
        options={{ title: "Subscriptions" }}
      />
      <SubscriptionStack.Screen
        name="Form"
        component={FormScreen}
        options={{ title: "Edit" }}
      />
    </SubscriptionStack.Navigator>
  );
};

// ░▒▓ Bottom Tabs ▓▒░
const Tab = createBottomTabNavigator<RootTabParamList>();

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
            case "SubscriptionsForm":
              iconName = focused ? "plus-circle" : "plus-circle-outline";
              break;
            case "SubscriptionsList":
              iconName = focused
                ? "format-list-bulleted"
                : "format-list-bulleted";
              break;
            case "Settings":
              iconName = focused ? "cog" : "cog-outline";
              break;
            default:
              iconName = "alert-circle-outline";
          }
          return <Icon source={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtitle,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          height: 60,
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
        name="SubscriptionsForm"
        component={FormScreen}
        options={{ title: "Create Subscription" }}
      />
      <Tab.Screen
        name="SubscriptionsList"
        component={SubscriptionNavigator}
        options={{
          title: "Subscriptions",
          headerShown: false, // importante para que el stack controle el header
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};
