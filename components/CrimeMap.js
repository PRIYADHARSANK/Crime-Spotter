import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Modal, Text, TouchableOpacity, Linking } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = "https://api-2-2-88x4.onrender.com/crimes";
const REFRESH_INTERVAL = 5000; // 5 seconds
const CLUSTER_RADIUS = 0.01; // ~1.1km in latitude/longitude degrees

// Define random crimes with colors
const RANDOM_CRIMES = [
  { type: "Robbery", color: "red" },
  { type: "Burglary", color: "orange" },
  { type: "Assault", color: "purple" },
  { type: "Vandalism", color: "blue" },
  { type: "Drug Offense", color: "green" },
  { type: "Fraud", color: "yellow" },
  { type: "Homicide", color: "black" },
  { type: "Vehicle Theft", color: "brown" },
  { type: "Cybercrime", color: "cyan" },
  { type: "Kidnapping", color: "pink" },
  { type: "human trafficking", color: "gray"},
];

// Function to fetch crime data
const fetchCrimeData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const crimes = await response.json();

    // Assign colors based on crime type
    return crimes.map((crime) => {
      const matchedCrime = RANDOM_CRIMES.find((c) => c.type === crime.crime_type);
      return { ...crime, color: matchedCrime ? matchedCrime.color : "gray" };
    });
  } catch (error) {
    console.error("Error fetching crime data:", error);
    return [];
  }
};

// Function to cluster crimes based on proximity
const clusterCrimes = (crimes) => {
  const clusters = [];

  crimes.forEach((crime) => {
    let foundCluster = false;

    for (let cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(crime.latitude - cluster.latitude, 2) +
        Math.pow(crime.longitude - cluster.longitude, 2)
      );

      if (distance < CLUSTER_RADIUS) {
        cluster.count += 1;
        foundCluster = true;
        break;
      }
    }

    if (!foundCluster) {
      clusters.push({ latitude: crime.latitude, longitude: crime.longitude, count: 1 });
    }
  });

  return clusters;
};

const CrimeMap = () => {
  const navigation = useNavigation();
  const [crimeData, setCrimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState("both"); // "pointers", "hotspot", "both"

   const openAddCrimeForm = () => {
      Linking.openURL("https://api-2-2-88x4.onrender.com/form");
    };
  

  useEffect(() => {
    let isMounted = true;

    const loadCrimeData = async () => {
      const data = await fetchCrimeData();
      if (isMounted) {
        setCrimeData(data);
        setLoading(false);
      }
    };

    // Initial fetch
    loadCrimeData();

    // Polling every 5 seconds
    const interval = setInterval(loadCrimeData, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval); // Cleanup interval on unmount
    };
  }, []);

  // Cluster the crime data
  const clusters = clusterCrimes(crimeData);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      ) : (
        <>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 8.7642,
              longitude: 78.1348,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Show markers if "pointers" or "both" is selected */}
            {(viewMode === "pointers" || viewMode === "both") &&
              crimeData.map((crime) => (
                <Marker
                  key={crime.id}
                  coordinate={{ latitude: crime.latitude, longitude: crime.longitude }}
                  title={crime.crime_type}
                  description={crime.location}
                  pinColor={crime.color} // Change marker color
                />
              ))}

            {/* Show hotspots if "hotspot" or "both" is selected */}
            {(viewMode === "hotspot" || viewMode === "both") &&
              clusters.map((cluster, index) => {
                let color = "green"; // Default color
                let radius = 300;

                if (cluster.count >= 10) {
                  color = "red";
                  radius = 1000;
                } else if (cluster.count >= 5) {
                  color = "yellow";
                  radius = 700;
                }

                return (
                  <Circle
                    key={index}
                    center={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                    radius={radius}
                    strokeColor={color}
                    fillColor={`rgba(${color === "red" ? "255,0,0" : color === "yellow" ? "255,255,0" : "0,255,0"}, 0.3)`}
                  />
                );
              })}
          </MapView>

          {/* Floating settings button */}
          <TouchableOpacity style={styles.settingsButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>

          {/* Popup modal for selecting view mode */}
          <Modal transparent={true} visible={modalVisible} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select View Mode</Text>

                <RadioButton.Group onValueChange={(value) => setViewMode(value)} value={viewMode}>
                  <View style={styles.radioOption}>
                    <RadioButton value="pointers" />
                    <Text>Pointers (Markers)</Text>
                  </View>

                  <View style={styles.radioOption}>
                    <RadioButton value="hotspot" />
                    <Text>Hotspots (Heatmap)</Text>
                  </View>

                  <View style={styles.radioOption}>
                    <RadioButton value="both" />
                    <Text>Both</Text>
                  </View>
                </RadioButton.Group>

                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
      <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Dashboard")}>
                <Icon name="home" size={30} color="#fff" />
                <Text style={styles.navText}>Home</Text>
              </TouchableOpacity>
      
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("CrimeMap")}>
                <Icon name="map" size={30} color="#32CD32" />
                <Text style={styles.navText}>Map</Text>
              </TouchableOpacity>
      
              <TouchableOpacity style={[styles.navItem, { marginTop: -40 }]} onPress={openAddCrimeForm}>
                <Icon name="add-circle" size={60} color="#32CD32" />
              </TouchableOpacity>
      
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Analytics")}>
                <Icon name="bar-chart" size={30} color="#fff" />
                <Text style={styles.navText}>Analytics</Text>
              </TouchableOpacity>
      
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfileScreen")}>
                <Icon name="person" size={30} color="#fff" />
                <Text style={styles.navText}>Profile</Text>
              </TouchableOpacity>
            </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, height: 500 },

  // Centered Loading Indicator
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Floating settings button
  settingsButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  settingsText: {
    fontSize: 24,
    color: "white",
    textAlign: "center",
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
    borderColor: "#333"
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

export default CrimeMap;
