import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = "https://api-2-2-88x4.onrender.com/crimes";
const screenWidth = Dimensions.get("window").width;

// Helper function to get color based on crime type
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

const AnalyticsScreen = () => {
  const navigation = useNavigation();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterArea, setFilterArea] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Fetch crime data
  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setCrimes(data);
        setLoading(false);
        
        // Trigger animations after data loads
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
        ]).start();
      } catch (error) {
        console.error("Error fetching crimes:", error);
        setLoading(false);
      }
    };
    fetchCrimes();
  }, []);

  // Filter crimes based on selected filters
  const getFilteredCrimes = () => {
    return crimes.filter((crime) => {
      const typeMatch = filterType === "all" || crime.crime_type === filterType;
      const areaMatch = filterArea === "all" || crime.location === filterArea;
      const dateMatch = filterDate === "all" || isWithinDateRange(crime.timestamp, filterDate);
      return typeMatch && areaMatch && dateMatch;
    });
  };

  const isWithinDateRange = (timestamp, range) => {
    const crimeDate = new Date(timestamp);
    const today = new Date();
    const daysDiff = Math.floor((today - crimeDate) / (1000 * 60 * 60 * 24));

    if (range === "week") return daysDiff <= 7;
    if (range === "month") return daysDiff <= 30;
    return true;
  };

  // Get crimes by type
  const getCrimesByType = () => {
    const filteredCrimes = getFilteredCrimes();
    const crimeTypes = {};
    filteredCrimes.forEach((crime) => {
      crimeTypes[crime.crime_type] = (crimeTypes[crime.crime_type] || 0) + 1;
    });
    return crimeTypes;
  };

  // Get crimes by week (last 4 weeks)
  const getCrimesByWeek = () => {
    const filteredCrimes = getFilteredCrimes();
    const weeks = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
    const today = new Date();

    filteredCrimes.forEach((crime) => {
      const crimeDate = new Date(crime.timestamp);
      const daysDiff = Math.floor((today - crimeDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) weeks["Week 1"]++;
      else if (daysDiff <= 14) weeks["Week 2"]++;
      else if (daysDiff <= 21) weeks["Week 3"]++;
      else if (daysDiff <= 28) weeks["Week 4"]++;
    });

    return weeks;
  };

  // Get summary statistics
  const getSummaryStats = () => {
    const filteredCrimes = getFilteredCrimes();
    const crimesByType = getCrimesByType();
    const mostCommon = Object.entries(crimesByType).sort((a, b) => b[1] - a[1])[0];
    
    return {
      total: filteredCrimes.length,
      mostCommon: mostCommon ? mostCommon[0] : "N/A",
      mostCommonCount: mostCommon ? mostCommon[1] : 0,
    };
  };

  // Get unique values for filters
  const getUniqueTypes = () => ["all", ...new Set(crimes.map((c) => c.crime_type))];
  const getUniqueAreas = () => ["all", ...new Set(crimes.map((c) => c.location))];

  // Prepare data for charts
  const crimesByType = getCrimesByType();
  const crimesByWeek = getCrimesByWeek();
  const stats = getSummaryStats();

  // Pie chart data
  const pieData = Object.entries(crimesByType).map(([type, count], index) => ({
    name: type,
    population: count,
    color: `hsl(${(index * 360) / Object.keys(crimesByType).length}, 70%, 50%)`,
    legendFontColor: "#fff",
    legendFontSize: 12,
  }));

  // Bar chart data
  const barData = {
    labels: Object.keys(crimesByWeek),
    datasets: [{ data: Object.values(crimesByWeek) }],
  };

  // Line chart data
  const lineData = {
    labels: Object.keys(crimesByWeek),
    datasets: [{ data: Object.values(crimesByWeek), strokeWidth: 2 }],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#32CD32" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="analytics" size={32} color="#32CD32" />
          <Text style={styles.title}>Crime Analytics</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              setLoading(true);
              // Refresh logic here
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            <Icon name="refresh" size={24} color="#32CD32" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <Animated.View 
            style={[
              styles.summaryContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.summaryCard}
            >
              <View style={styles.iconCircle}>
                <Icon name="warning" size={24} color="#32CD32" />
              </View>
              <Text style={styles.summaryNumber}>{stats.total}</Text>
              <Text style={styles.summaryLabel}>Total Crimes</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.summaryCard}
            >
              <View style={styles.iconCircle}>
                <Icon name="trending-up" size={24} color="#FF6B6B" />
              </View>
              <Text style={[styles.summaryNumber, { color: '#FF6B6B' }]}>{stats.mostCommonCount}</Text>
              <Text style={styles.summaryLabel}>Most Common</Text>
              <Text style={styles.summarySubtext}>{stats.mostCommon}</Text>
            </LinearGradient>
          </Animated.View>

        {/* Filters */}
        <Animated.View style={[{ opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#1a1a1a', '#0d0d0d']}
            style={styles.filtersContainer}
          >
            <View style={styles.filterHeader}>
              <Icon name="filter-list" size={24} color="#32CD32" />
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => {
                setFilterType("all");
                setFilterArea("all");
                setFilterDate("all");
              }}>
                <Text style={styles.clearFilters}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerLabelContainer}>
                <Icon name="category" size={18} color="#32CD32" />
                <Text style={styles.pickerLabel}>Crime Type</Text>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filterType}
                  style={styles.picker}
                  onValueChange={(value) => setFilterType(value)}
                  dropdownIconColor="#32CD32"
                >
                  {getUniqueTypes().map((type) => (
                    <Picker.Item key={type} label={type === "all" ? "All Types" : type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerLabelContainer}>
                <Icon name="place" size={18} color="#32CD32" />
                <Text style={styles.pickerLabel}>Location</Text>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filterArea}
                  style={styles.picker}
                  onValueChange={(value) => setFilterArea(value)}
                  dropdownIconColor="#32CD32"
                >
                  {getUniqueAreas().map((area) => (
                    <Picker.Item key={area} label={area === "all" ? "All Areas" : area} value={area} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerLabelContainer}>
                <Icon name="date-range" size={18} color="#32CD32" />
                <Text style={styles.pickerLabel}>Time Period</Text>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={filterDate}
                  style={styles.picker}
                  onValueChange={(value) => setFilterDate(value)}
                  dropdownIconColor="#32CD32"
                >
                  <Picker.Item label="All Time" value="all" />
                  <Picker.Item label="Last Week" value="week" />
                  <Picker.Item label="Last Month" value="month" />
                </Picker>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Empty State */}
        {getFilteredCrimes().length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <Icon name="search-off" size={80} color="#32CD32" />
            <Text style={styles.emptyStateTitle}>No Crimes Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters to see more results
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setFilterType("all");
                setFilterArea("all");
                setFilterDate("all");
              }}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Crimes by Type - Pie Chart */}
        {pieData.length > 0 && (
          <Animated.View style={[{ opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.chartContainer}
            >
              <Text style={styles.chartTitle}>📊 Crimes by Type</Text>
              <PieChart
                data={pieData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Crimes by Week - Bar Chart */}
        {Object.values(crimesByWeek).some((v) => v > 0) && (
          <Animated.View style={[{ opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.chartContainer}
            >
              <Text style={styles.chartTitle}>📈 Crimes by Week</Text>
              <BarChart
                data={barData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Crimes Trend - Line Chart */}
        {Object.values(crimesByWeek).some((v) => v > 0) && (
          <Animated.View style={[{ opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#1a1a1a', '#0d0d0d']}
              style={styles.chartContainer}
            >
              <Text style={styles.chartTitle}>📉 Crime Trend (Last 4 Weeks)</Text>
              <LineChart
                data={lineData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
              />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Detailed Crime List */}
        {getFilteredCrimes().length > 0 && (
          <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
            <View style={styles.detailsHeader}>
              <Icon name="list-alt" size={28} color="#32CD32" />
              <Text style={styles.detailsTitle}>
                Crime Details
              </Text>
            </View>
            <View style={styles.detailsBadge}>
              <Text style={styles.detailsCount}>
                {getFilteredCrimes().length} {getFilteredCrimes().length === 1 ? 'Crime' : 'Crimes'} Found
              </Text>
            </View>
            
            {getFilteredCrimes().map((crime, index) => (
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
                    <View style={styles.crimeDetails}>
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
                      
                      {crime.latitude && crime.longitude && (
                        <View style={styles.detailRow}>
                          <Icon name="my-location" size={18} color="#32CD32" />
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>GPS Coordinates</Text>
                            <Text style={styles.detailValue}>
                              Lat: {crime.latitude.toFixed(6)}, Lng: {crime.longitude.toFixed(6)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      </LinearGradient>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Dashboard")}>
          <Icon name="home" size={30} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("CrimeMap")}>
          <Icon name="map" size={30} color="#fff" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Analytics")}>
          <Icon name="bar-chart" size={30} color="#32CD32" />
          <Text style={[styles.navText, { color: "#32CD32" }]}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("CrimeTable")}>
          <Icon name="table-chart" size={30} color="#fff" />
          <Text style={styles.navText}>Table</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfileScreen")}>
          <Icon name="person" size={30} color="#fff" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const chartConfig = {
  backgroundColor: "#000",
  backgroundGradientFrom: "#1a1a1a",
  backgroundGradientFromOpacity: 0.8,
  backgroundGradientTo: "#000",
  backgroundGradientToOpacity: 0.9,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { 
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#32CD32",
  },
  propsForBackgroundLines: {
    strokeDasharray: "", // solid background lines
    stroke: "rgba(255, 255, 255, 0.1)",
  },
  fillShadowGradient: "#32CD32",
  fillShadowGradientOpacity: 0.3,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginLeft: 10,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.3)",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#32CD32",
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
    fontWeight: "600",
  },
  summarySubtext: {
    fontSize: 11,
    color: "#32CD32",
    marginTop: 5,
    fontWeight: "bold",
  },
  filtersContainer: {
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.3)",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginLeft: 10,
  },
  clearFilters: {
    color: "#32CD32",
    fontSize: 14,
    fontWeight: "600",
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pickerLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  pickerWrapper: {
    backgroundColor: "#000",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.3)",
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    height: 50,
  },
  chartContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.3)",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32CD32",
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#111",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#32CD32",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: "rgba(26, 26, 26, 0.5)",
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.2)",
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#32CD32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    flex: 1,
  },
  detailsBadge: {
    backgroundColor: "rgba(50, 205, 50, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(50, 205, 50, 0.5)",
  },
  detailsCount: {
    color: "#32CD32",
    fontSize: 14,
    fontWeight: "bold",
  },
  crimeCard: {
    borderRadius: 15,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flex: 1,
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
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  crimeQuickInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  quickInfoText: {
    color: "#aaa",
    fontSize: 13,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(50, 205, 50, 0.2)",
    marginVertical: 15,
  },
  crimeDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalyticsScreen;
