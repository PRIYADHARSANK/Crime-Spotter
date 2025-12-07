import React, {useState, useEffect, useRef} from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Alert, Linking } from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = () => {
  const user = useUser();
  const {  signOut } = useAuth();
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (user) {
      setUserName(user.user.firstName || "User");
      setUserEmail(user.user.primaryEmailAddress?.emailAddress || "");
    }
    
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Logout", 
          style: "destructive",
          onPress: async () => {
            await signOut();
            navigation.replace("SignIn");
          }
        }
      ]
    );
  };

  const openAddCrimeForm = () => {
    Linking.openURL("https://api-2-2-88x4.onrender.com/form");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Animated.View 
            style={[
              styles.profileHeader,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#32CD32', '#28a428', '#1f7d1f']}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              <View style={styles.avatarBadge}>
                <Icon name="verified" size={20} color="#32CD32" />
              </View>
            </LinearGradient>
            
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5.0</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View style={[{ opacity: fadeAnim }]}>
            {/* Account Settings */}
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="person-outline" size={24} color="#32CD32" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Edit Profile</Text>
                  <Text style={styles.menuSubtitle}>Update your information</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="security" size={24} color="#32CD32" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Privacy & Security</Text>
                  <Text style={styles.menuSubtitle}>Manage your data</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="notifications-active" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Notifications</Text>
                  <Text style={styles.menuSubtitle}>Alerts and updates</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            {/* App Settings */}
            <Text style={styles.sectionTitle}>Preferences</Text>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="language" size={24} color="#6C5CE7" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Language</Text>
                  <Text style={styles.menuSubtitle}>English (US)</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="location-on" size={24} color="#FFD93D" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Location Services</Text>
                  <Text style={styles.menuSubtitle}>Allow location access</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Support */}
            <Text style={styles.sectionTitle}>Support</Text>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="help-outline" size={24} color="#32CD32" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Help Center</Text>
                  <Text style={styles.menuSubtitle}>FAQs and support</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard}>
              <LinearGradient
                colors={['#1a1a1a', '#0f0f0f']}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIconContainer}>
                  <Icon name="info-outline" size={24} color="#32CD32" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>About</Text>
                  <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#888" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
              <LinearGradient
                colors={['rgba(233, 69, 96, 0.2)', 'rgba(233, 69, 96, 0.1)']}
                style={styles.logoutGradient}
              >
                <Icon name="logout" size={24} color="#e94560" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Dashboard")}>
          <Icon name="home" size={26} color="#888" />
          <Text style={styles.navText}>Home</Text>
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
          <View style={styles.activeNavIndicator}>
            <Icon name="person" size={26} color="#32CD32" />
          </View>
          <Text style={[styles.navText, { color: "#32CD32" }]}>Profile</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    position: "relative",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#888",
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.5)",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32CD32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(50, 205, 50, 0.2)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 25,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuCard: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: "hidden",
  },
  menuCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
    borderRadius: 15,
  },
  menuIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  logoutCard: {
    marginTop: 30,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(233, 69, 96, 0.3)",
    borderRadius: 15,
    gap: 10,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e94560",
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
  },
});

export default ProfileScreen;
