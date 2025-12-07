import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  getToken: async () => {
    const token = await SecureStore.getItemAsync("userToken");
    return token ?? null;
  },
  saveToken: async (token) => {
    if (token && typeof token === "string") {
      await SecureStore.setItemAsync("userToken", token);
    } else {
      console.error("❌ Attempted to store invalid token:", token);
    }
  },
};

export const ClerkWrapper = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
      debug={true} // Enable debug mode
    >
      {children}
    </ClerkProvider>
  );
};
