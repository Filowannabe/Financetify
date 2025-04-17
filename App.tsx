import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { ThemeProvider } from "./src/themes/index";
import React from "react";
import { IncomesCalculator } from "./src/IncomesCalculator";
import { SettingsProvider } from "./src/settings";
import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { SubscriptionProvider } from "./src/views/Subscriptions/SubscriptionContext";

enableScreens();
export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <SubscriptionProvider>
              <NavigationContainer>
                <IncomesCalculator />
              </NavigationContainer>
            </SubscriptionProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
