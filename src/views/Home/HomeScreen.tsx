import React from "react";
import { View, Text } from "react-native";

import { stylesApp, useAppTheme } from "../../themes";
import { Icon } from "react-native-paper";

export const HomeScreen = () => {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        stylesApp.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text style={[stylesApp.title, { color: theme.colors.text }]}>
        📱 Subscription Manager
      </Text>
      <Icon source="rocket" size={40} color={theme.colors.primary} />
      <Text style={[stylesApp.subtitle, { color: theme.colors.subtitle }]}>
        Manage all your subscriptions in one place!
      </Text>
    </View>
  );
};
