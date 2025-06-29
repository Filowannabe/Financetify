import type {
  NavigatorScreenParams,
  NavigationProp,
} from "@react-navigation/native";
import type { SubscriptionEntity } from "./SubscriptionTypes"; // ajusta si tu ruta es distinta

// ░▒▓ STACK (Subscriptions2) ▓▒░
export type AppStackParamList = {
  List: { defaultToFirebase: boolean } | undefined;
  Form: {
    index?: number;
    subscription?: SubscriptionEntity;
    fromFirebase?: boolean;
  };
  Subscriptions2: undefined; // se usa para navegar directo al Tab si hicieras un redirect
};

// ░▒▓ TABS ▓▒░
export type RootTabParamList = {
  Home: undefined;
  SubscriptionsForm: undefined;
  Subscriptions2: NavigatorScreenParams<AppStackParamList>;
  Settings: undefined;
};

// ░▒▓ ROOT STACK (si tuvieras otra navegación raíz, opcional) ▓▒░
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  AppStack: NavigatorScreenParams<AppStackParamList>;
};

// ░▒▓ HOOKS de navegación ▓▒░

export type AppStackNavigation<T extends keyof AppStackParamList> = {
  navigation: NavigationProp<AppStackParamList, T>;
};

export type TabNavigation<T extends keyof RootTabParamList> = {
  navigation: NavigationProp<RootTabParamList, T>;
};

// 👉 Para navegación general dentro de Tabs (como desde FormScreen a Subscriptions2)
export type RootNavigation = NavigationProp<RootTabParamList>;
