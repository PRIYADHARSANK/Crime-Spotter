import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Animated, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from 'expo-linear-gradient';

const getCrimeTypeColor = (type) => {
  const colorMap = {
    "Robbery": "#e74c3c",
    "Burglary": "#e67e22",
    "Assault": "#9b59b6",
    "Vandalism": "#3498db",
    "Drug Offense": "#27ae60",
    "Fraud": "#f39c12",
    "Homicide": "#34495e",
    "Vehicle Theft": "#8e44ad",
    "Cybercrime": "#16a085",
    "Kidnapping": "#e91e63",
    "human trafficking": "#607d8b",
  };
  return colorMap[type] || "#95a5a6";
};

const CrimeTable = () => {
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openAddCrimeForm = () => {
        Linking.openURL("https://api-2-2-88x4.onrender.com/form");
      };

  const fetchCrimes = async () => {
    try {
      const response = await fetch("https://api-2-2-88x4.onrender.com/crimes");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
     

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received.");
      }

      setCrimes(data.reverse());
      
      // Animate on load
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error fetching crime data:", error);
      Alert.alert("Error", "Failed to fetch crime data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrimes(); // Initial fetch

    const interval = setInterval(() => {
      fetchCrimes(); // Fetch every 5 seconds
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Icon name="list-alt" size={32} color="#32CD32" />
          <Text style={styles.title}>Crime Reports</Text>
          <TouchableOpacity onPress={fetchCrimes} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="#32CD32" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32CD32" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={['#1a1a1a', '#0d0d0d']}
                style={styles.statCard}
              >
                <Icon name="warning" size={28} color="#32CD32" />
                <Text style={styles.statNumber}>{crimes.length}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#1a1a1a', '#0d0d0d']}
                style={styles.statCard}
              >
                <Icon name="schedule" size={28} color="#FF6B6B" />
                <Text style={styles.statNumber}>Live</Text>
                <Text style={styles.statLabel}>Real-time</Text>
              </LinearGradient>
            </View>

            {crimes.length > 0 ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                {crimes.map((crime, index) => (
                  <TouchableOpacity 
                    key={crime.id || index} 
                    style={styles.crimeCard}
                    onPress={() => setExpandedCard(expandedCard === index ? null : index)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#1a1a1a', '#0f0f0f']}
                      style={styles.crimeCardGradient}
                    >
                      <View style={styles.crimeHeader}>
                        <View style={styles.crimeHeaderLeft}>
                          <View style={styles.crimeNumberBadge}>
                            <Text style={styles.crimeNumber}>#{index + 1}</Text>
                          </View>
                          <View style={[styles.crimeTypeBadge, { backgroundColor: getCrimeTypeColor(crime.crime_type) }]}>
                            <Text style={styles.crimeTypeText}>{crime.crime_type || "Unknown"}</Text>
                          </View>
                        </View>
                        <Icon 
                          name={expandedCard === index ? "expand-less" : "expand-more"} 
                          size={24} 
                          color="#32CD32" 
                        />
                      </View>

                      <View style={styles.crimeQuickInfo}>
                        <View style={styles.quickInfoItem}>
                          <Icon name="location-on" size={16} color="#32CD32" />
                          <Text style={styles.quickInfoText} numberOfLines={1}>
                            {crime.location || "Unknown"}
                          </Text>
                        </View>
                        {crime.timestamp && (
                          <View style={styles.quickInfoItem}>
                            <Icon name="schedule" size={16} color="#aaa" />
                            <Text style={styles.quickInfoText}>
                              {new Date(crime.timestamp).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {expandedCard === index && (
                        <View style={styles.expandedDetails}>
                          <View style={styles.divider} />
                          
                          {crime.timestamp && (
                            <View style={styles.detailRow}>
                              <Icon name="access-time" size={18} color="#32CD32" />
                              <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Full Date & Time</Text>
                                <Text style={styles.detailValue}>
                                  {new Date(crime.timestamp).toLocaleDateString()} at {new Date(crime.timestamp).toLocaleTimeString()}
                                </Text>
                              </View>
                            </View>
                          )}
                          
                          <View style={styles.detailRow}>
                            <Icon name="place" size={18} color="#32CD32" />
                            <View style={styles.detailContent}>
                              <Text style={styles.detailLabel}>Location</Text>
                              <Text style={styles.detailValue}>{crime.location || "Unknown"}</Text>
                            </View>
                          </View>
                          
                          {crime.description && (
                            <View style={styles.detailRow}>
                              <Icon name="description" size={18} color="#32CD32" />
                              <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Description</Text>
                                <Text style={styles.detailValue}>{crime.description}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="search-off" size={60} color="#32CD32" />
                <Text style={styles.emptyStateText}>No crime reports available</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </LinearGradient>

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
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.3)",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#32CD32",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  crimeCard: {
    borderRadius: 15,
    marginBottom: 12,
    overflow: "hidden",
  },
  crimeCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
    borderRadius: 15,
  },
  crimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  crimeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crimeNumberBadge: {
    backgroundColor: "rgba(50, 205, 50, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.5)",
  },
  crimeNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#32CD32",
  },
  crimeTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  crimeTypeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  crimeQuickInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quickInfoText: {
    color: "#aaa",
    fontSize: 13,
    marginLeft: 6,
  },
  expandedDetails: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(50, 205, 50, 0.2)",
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#888",
    fontSize: 16,
    marginTop: 15,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    flexDirection: "row",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
  },
  navText: {
    color: "#888",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
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
  // Remove old unused styles
  tableHeader: {
    display: "none",
  },
  headerText: {
    display: "none",
  },
  row: {
    display: "none",
  },
  cell: {
    display: "none",
  },
  noDataText: {
    display: "none",
  },
  headerID: {
    display: "none",
  },
  headerType: {
    display: "none",
  },
  headerLocation: {
    display: "none",
  },
  cellID: {
    display: "none",
  },
  cellType: {
    display: "none",
  },
  cellLocation: {
    display: "none",
  },
  title2: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#2c3e50",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerID: { flex: 0.5 },
  headerType: { flex: 2 },
  headerLocation: { flex: 2 },

  row: {
    flexDirection: "row",
    backgroundColor: "#ecf0f1",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dcdde1",
    borderRadius: 3,
  },
  cell: {
    fontSize: 15,
    textAlign: "center",
  },
  cellID: { flex: 0.5 },
  cellType: { flex: 2 },
  cellLocation: { flex: 2 },

  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 10,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100vw",
    backgroundColor: "#111",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#333",
    marginRight:-40
  },
  navItem: {
    alignItems: "center",
    flex: 1
  },
  navText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2
  }
});

export default CrimeTable;
