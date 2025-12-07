import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Linking, Easing, Alert, ScrollView, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Video } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
import crimeVideo from "../assets/intro.mp4"; // Import local video

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const videoRef = useRef(null);

  // Animations
  const bounceTitleAnim = useRef(new Animated.Value(0)).current;
  const floatUserInfoAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (user) {
      setUserName(user.firstName || "User");
      setUserEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user]);

  useEffect(() => {
    Animated.spring(bounceTitleAnim, {
      toValue: 1,
      friction: 2,
      tension: 70,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([  
        Animated.timing(floatUserInfoAnim, {
          toValue: 5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatUserInfoAnim, {
          toValue: -5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start()
    );

    Animated.timing(fadeOutAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([  
        Animated.timing(breatheAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start()
    );
  }, []);

  const openAddCrimeForm = () => {
    Linking.openURL("https://api-2-2-88x4.onrender.com/form");
  };

  // Logout Confirmation
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: async () => {
            await signOut();
            navigation.replace("SignIn"); // Redirect to SignIn screen
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        {/* Header with User Info */}
        <View style={styles.header}>
          <Animated.View style={[styles.userInfo, { transform: [{ translateY: floatUserInfoAnim }] }]}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#32CD32', '#28a428']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </Animated.View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['rgba(233, 69, 96, 0.3)', 'rgba(233, 69, 96, 0.1)']}
              style={styles.logoutButtonGradient}
            >
              <Icon name="logout" size={20} color="#e94560" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: fadeOutAnim }]}>
          <View style={styles.titleContainer}>
            <Icon name="security" size={40} color="#32CD32" />
            <Animated.Text style={[styles.title, { transform: [{ scale: bounceTitleAnim }] }]}>
              CrimeSpotter
            </Animated.Text>
          </View>
          <Text style={styles.subtitle}>Your Community Safety Companion</Text>
        </Animated.View>

        {/* Quick Action Cards */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("CrimeMap")}
          >
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.actionCardGradient}
            >
              <View style={styles.iconCircle}>
                <Icon name="map" size={30} color="#32CD32" />
              </View>
              <Text style={styles.actionCardTitle}>Crime Map</Text>
              <Text style={styles.actionCardSubtitle}>View crimes nearby</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("Analytics")}
          >
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.actionCardGradient}
            >
              <View style={styles.iconCircle}>
                <Icon name="bar-chart" size={30} color="#FF6B6B" />
              </View>
              <Text style={styles.actionCardTitle}>Analytics</Text>
              <Text style={styles.actionCardSubtitle}>View statistics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Video Section */}
        <Animated.View style={[styles.videoContainer, { transform: [{ scale: breatheAnim }] }]}>
          <Video
            ref={videoRef}
            source={crimeVideo}
            style={styles.video}
            shouldPlay
            isLooping
            resizeMode="cover"
            onError={(error) => console.log("Video Error:", error)}
          />
          <View style={styles.videoOverlay}>
            
          </View>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View style={[{ opacity: fadeOutAnim }]}>


          <TouchableOpacity style={styles.featureCard} onPress={openAddCrimeForm}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="report" size={32} color="#FFD93D" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Report a Crime</Text>
                <Text style={styles.featureDescription}>
                  Quick and easy crime reporting to keep community safe
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#FFD93D" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("Analytics")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="insights" size={32} color="#6C5CE7" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Crime Statistics</Text>
                <Text style={styles.featureDescription}>
                  Explore trends and patterns through data visualization
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#6C5CE7" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("AnalyticsDashboard")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="assessment" size={32} color="#00D9FF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-Time Analytics</Text>
                <Text style={styles.featureDescription}>
                  Power BI-style dashboard with live crime statistics and trends
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#00D9FF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("CrimePredictor")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="psychology" size={32} color="#32CD32" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI Crime Predictor</Text>
                <Text style={styles.featureDescription}>
                  Predict crime risk and get safety recommendations
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#32CD32" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("CommunityForum")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="forum" size={32} color="#FFD93D" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Community Forum</Text>
                <Text style={styles.featureDescription}>
                  Connect, discuss safety tips, and stay informed together
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#FFD93D" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("SafeRoute")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="directions" size={32} color="#6C5CE7" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Safe Route Planner</Text>
                <Text style={styles.featureDescription}>
                  Navigate safely avoiding high-crime areas with smart routing
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#6C5CE7" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("CrimeTrends")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="timeline" size={32} color="#FF6B6B" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Crime Trends Timeline</Text>
                <Text style={styles.featureDescription}>
                  Analyze patterns, track hotspots, and predict future risks
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#FF6B6B" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("RealTimeCrimeAlerts")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="notifications-active" size={32} color="#FF6B6B" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-Time Crime Alerts</Text>
                <Text style={styles.featureDescription}>
                  Get instant notifications about crimes in your area
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#FF6B6B" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate("EvidenceUpload")}>
            <LinearGradient
              colors={['#1a1a1a', '#0f0f0f']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.featureCardGradient}
            >
              <View style={styles.featureIconContainer}>
                <Icon name="add-a-photo" size={32} color="#32CD32" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Evidence Upload</Text>
                <Text style={styles.featureDescription}>
                  Report crimes with photo/video evidence instantly
                </Text>
              </View>
              <Icon name="arrow-forward-ios" size={20} color="#32CD32" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </LinearGradient>

      {/* Fixed Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Dashboard")}>
          <View style={styles.activeNavIndicator}>
            <Icon name="home" size={26} color="#32CD32" />
          </View>
          <Text style={[styles.navText, { color: "#32CD32" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("CrimeMap")}>
          <Icon name="map" size={26} color="#888" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={openAddCrimeForm}>
          <LinearGradient
            colors={['#32CD32', '#28a428']}
            style={styles.fabButton}
          >
            <Icon name="add" size={32} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Analytics")}>
          <Icon name="bar-chart" size={26} color="#888" />
          <Text style={styles.navText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfileScreen")}>
          <Icon name="person" size={26} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#888",
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  logoutButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  logoutButtonGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(233, 69, 96, 0.3)",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },
  quickActions: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  actionCard: {
    flex: 1,
    borderRadius: 15,
    overflow: "hidden",
  },
  actionCardGradient: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
    borderRadius: 15,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: "#888",
  },
  videoContainer: {
    position: "relative",
    marginBottom: 25,
    borderRadius: 20,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: 20,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  featureCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: "hidden",
  },
  featureCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
    borderRadius: 15,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
    backdropFilter: "blur(10px)",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 5,
  },
  navText: {
    color: "#888",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  activeNavIndicator: {
    backgroundColor: "rgba(50, 205, 50, 0.15)",
    borderRadius: 12,
    padding: 8,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default DashboardScreen;
