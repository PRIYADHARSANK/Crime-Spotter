import React from "react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import DashboardScreen from "./screens/DashboardScreen";
import CrimeMap from "./components/CrimeMap";
import CrimeTable from "./components/CrimeTable";
import SignInScreen from "./screens/signinScreen"; // Ensure correct capitalization
import ProfileScreen from "./screens/profileScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import CrimePredictorScreen from "./screens/CrimePredictorScreen";
import CommunityForumScreen from "./screens/CommunityForumScreen";
import SafeRouteScreen from "./screens/SafeRouteScreen";
import CrimeTrendsScreen from "./screens/CrimeTrendsScreen";
import EvidenceUploadScreen from "./screens/EvidenceUploadScreen";
import AnalyticsDashboardScreen from "./screens/AnalyticsDashboardScreen";
import RealTimeCrimeAlertsScreen from "./screens/RealTimeCrimeAlertsScreen";

const Stack = createStackNavigator();
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="CrimeMap" component={CrimeMap} />
          <Stack.Screen name="CrimeTable" component={CrimeTable} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="CrimePredictor" component={CrimePredictorScreen} />
          <Stack.Screen name="CommunityForum" component={CommunityForumScreen} />
          <Stack.Screen name="SafeRoute" component={SafeRouteScreen} />
          <Stack.Screen name="CrimeTrends" component={CrimeTrendsScreen} />
          <Stack.Screen name="EvidenceUpload" component={EvidenceUploadScreen} />
          <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
          <Stack.Screen name="RealTimeCrimeAlerts" component={RealTimeCrimeAlertsScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ClerkProvider>
  );
}
