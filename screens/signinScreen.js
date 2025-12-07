import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";
import crimeVideo from "../assets/bg.mp4";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const SignInScreen = () => {
  const { signIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const navigation = useNavigation();
  const videoRef = useRef(null);


  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
  
    setLoading(true);
  
    try {
      if (isSignUp) {
       
  
        const result = await signUp.create({
          emailAddress: email,
          password,
        });
  
        
  
        await signUp.update({ firstName: name });
  
        await signUp.prepareEmailAddressVerification();
  
        Alert.alert("Success", "A verification code has been sent to your email.");
        setIsVerifying(true);
      } else {
        
  
        const signInResult = await signIn.create({
          identifier: email,
          password,
        });
  
        
  
        if (signInResult.status === "complete") {
          
  
          await SecureStore.setItemAsync("userToken", String(signInResult.createdSessionId));
          await setActive({ session: signInResult.createdSessionId });
  
          // Redirect to Dashboard
          navigation.reset({
            index: 0,
            routes: [{ name: "Dashboard" }],
          });
  
        } else if (signInResult.status === "needs_first_factor") {
          
  
          const completeSignIn = await signIn.attemptFirstFactor({ strategy: "password", password });
  
          console.log("🔄 First-factor result:", completeSignIn);
  
          if (completeSignIn.createdSessionId) {
            
  
            await SecureStore.setItemAsync("userToken", String(completeSignIn.createdSessionId));
            await setActive({ session: completeSignIn.createdSessionId });
  
            // Redirect to Dashboard
            navigation.reset({
              index: 0,
              routes: [{ name: "Dashboard" }],
            });
          } else {
            throw new Error("Sign-in failed: No session ID returned after first factor.");
          }
        } else {
          throw new Error("Unexpected sign-in status: " + signInResult.status);
        }
      }
    } catch (err) {
      console.error("🚨 Authentication error:", err);
      Alert.alert("Authentication Failed", err.errors?.[0]?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }
  
    setLoading(true);
    try {
      
  
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.toString(),
      });
  
      
  
      if (result.status === "complete") {
        const sessionId = result.createdSessionId;
        
        await SecureStore.setItemAsync("userToken", String(sessionId));
        await setActive({ session: sessionId });
  
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        });
      } else {
        throw new Error("Verification failed. Please try again.");
      }
    } catch (err) {
      
      Alert.alert("Verification Failed", err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };
  
  // ... [Keep all your existing state and logic hooks] ...

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Video Background */}
      <Video
        ref={videoRef}
        source={crimeVideo}
        style={styles.video}
        shouldPlay
        isLooping
        resizeMode="cover"
        onError={(error) => console.log("Video Error:", error)}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(20,20,30,0.9)']}
        style={styles.overlay}
      />

      <View style={styles.formContainer}>
        <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? "Join our investigation team" : "Continue your investigation"}
        </Text>

        {isSignUp && (
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.authButton} 
          onPress={handleAuth} 
          disabled={loading}
        >
          <LinearGradient
            colors={['#4a6cf7', '#2541b2']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {isVerifying && (
          <>
            <View style={styles.inputContainer}>
              <MaterialIcons name="verified-user" size={20} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>
            <TouchableOpacity 
              style={styles.verifyButton} 
              onPress={handleVerifyCode} 
              disabled={loading}
            >
              <Text style={styles.verifyButtonText}>
                Verify Code
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          onPress={() => { setIsSignUp(!isSignUp); setIsVerifying(false); }}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={styles.toggleTextBold}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "white",
    fontFamily: "Inter-Black",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#aaa",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "white",
    fontSize: 16,
  },
  authButton: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  verifyButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4a6cf7",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  verifyButtonText: {
    color: "#4a6cf7",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 25,
    alignItems: "center",
  },
  toggleText: {
    color: "#aaa",
    fontSize: 14,
  },
  toggleTextBold: {
    color: "#4a6cf7",
    fontWeight: "bold",
  },
});

export default SignInScreen;