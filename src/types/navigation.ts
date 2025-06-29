import type { NavigatorScreenParams } from "@react-navigation/native";

// Define all stack navigator params
export type AppStackParamList = {
  List: undefined;
  Form: undefined;
  Subscriptions2: undefined;
};

// Define tab navigator params
export type RootTabParamList = {
  Home: undefined;
  SubscriptionsForm: undefined;
  Subscriptions2: undefined;
  Settings: undefined;
};

// Combined type for root navigation
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  AppStack: NavigatorScreenParams<AppStackParamList>;
};

// Type utilities
export type AppStackNavigation<T extends keyof AppStackParamList> = {
  navigation: import("@react-navigation/native").NavigationProp<
    AppStackParamList,
    T
  >;
};

export type TabNavigation<T extends keyof RootTabParamList> = {
  navigation: import("@react-navigation/native").NavigationProp<
    RootTabParamList,
    T
  >;
};
