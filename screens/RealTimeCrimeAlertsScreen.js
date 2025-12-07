import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Animated, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const RealTimeCrimeAlertsScreen = () => {
  const navigation = useNavigation();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [userLocation, setUserLocation] = useState('');
  const [alertRadius, setAlertRadius] = useState('5');
  const [lastChecked, setLastChecked] = useState(new Date());
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [crimeData, setCrimeData] = useState([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState({
    Theft: true,
    Assault: true,
    Burglary: true,
    Robbery: true,
    Vandalism: true,
    'Drug-related': true,
    'Vehicle Theft': true,
    Fraud: true,
    'Cyber Crime': true,
    Other: false,
  });

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request notification permissions
    requestNotificationPermissions();
    
    // Initial data fetch
    fetchCrimeData();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for alert indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Real-time monitoring (check every 10 seconds)
    const intervalId = setInterval(() => {
      if (alertsEnabled) {
        fetchCrimeData();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [alertsEnabled, userLocation, alertRadius, selectedCrimeTypes]);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications to receive crime alerts.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const fetchCrimeData = async () => {
    try {
      const response = await fetch('https://api-2-2-88x4.onrender.com/crimes');
      const data = await response.json();
      
      const processedData = data.map(crime => ({
        ...crime,
        date: crime.date || crime.createdAt || new Date().toISOString(),
      }));

      // Check for new crimes since last check
      if (crimeData.length > 0 && processedData.length > crimeData.length) {
        const newCrimes = processedData.slice(crimeData.length);
        checkAndSendAlerts(newCrimes);
      }

      setCrimeData(processedData);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error fetching crime data:', error);
    }
  };

  const checkAndSendAlerts = async (newCrimes) => {
    if (!alertsEnabled) return;

    const relevantCrimes = newCrimes.filter(crime => {
      // Filter by crime type
      const crimeType = crime.crime_type || 'Other';
      if (!selectedCrimeTypes[crimeType]) return false;

      // Filter by location (if user location is set)
      if (userLocation && crime.location) {
        const locationMatch = crime.location.toLowerCase().includes(userLocation.toLowerCase());
        if (!locationMatch) return false;
      }

      return true;
    });

    // Send notifications for relevant crimes
    for (const crime of relevantCrimes) {
      await sendNotification(crime);
      
      // Add to recent alerts
      setRecentAlerts(prev => [{
        ...crime,
        alertTime: new Date(),
      }, ...prev].slice(0, 10));
    }
  };

  const sendNotification = async (crime) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Crime Alert: ${crime.crime_type || 'Incident'}`,
          body: `${crime.location || 'Nearby location'} - ${crime.description || 'New crime reported'}`,
          data: { crimeId: crime._id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const toggleCrimeType = (type) => {
    setSelectedCrimeTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getCrimeIcon = (crimeType) => {
    const icons = {
      'Theft': 'money-off',
      'Assault': 'warning',
      'Burglary': 'home',
      'Robbery': 'gavel',
      'Vandalism': 'broken-image',
      'Drug-related': 'medical-services',
      'Vehicle Theft': 'directions-car',
      'Fraud': 'credit-card',
      'Cyber Crime': 'computer',
    };
    return icons[crimeType] || 'report-problem';
  };

  const getCrimeColor = (crimeType) => {
    const colors = {
      'Theft': '#FFD93D',
      'Assault': '#FF6B6B',
      'Burglary': '#FF6B6B',
      'Robbery': '#FF6B6B',
      'Vandalism': '#FFD93D',
      'Drug-related': '#6C5CE7',
      'Vehicle Theft': '#FFD93D',
      'Fraud': '#FF6B6B',
      'Cyber Crime': '#00D9FF',
    };
    return colors[crimeType] || '#888';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Crime Alerts</Text>
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </Animated.View>

        {/* Master Alert Toggle */}
        <Animated.View style={[styles.masterCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={alertsEnabled ? ['rgba(50, 205, 50, 0.2)', 'rgba(50, 205, 50, 0.05)'] : ['rgba(136, 136, 136, 0.2)', 'rgba(136, 136, 136, 0.05)']}
            style={styles.masterGradient}
          >
            <View style={styles.masterContent}>
              <View style={styles.masterLeft}>
                <Icon name="notifications-active" size={40} color={alertsEnabled ? '#32CD32' : '#888'} />
                <View style={styles.masterInfo}>
                  <Text style={styles.masterTitle}>Real-Time Alerts</Text>
                  <Text style={styles.masterSubtext}>
                    {alertsEnabled ? 'Monitoring for crimes' : 'Alerts disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={alertsEnabled}
                onValueChange={setAlertsEnabled}
                trackColor={{ false: '#333', true: 'rgba(50, 205, 50, 0.5)' }}
                thumbColor={alertsEnabled ? '#32CD32' : '#888'}
              />
            </View>
            <Text style={styles.lastCheckedText}>
              Last checked: {formatTimeAgo(lastChecked)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Location Settings */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <Icon name="location-on" size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Location Settings</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="place" size={20} color="#888" />
              <TextInput
                style={styles.input}
                placeholder="Enter your location (e.g., Downtown)"
                placeholderTextColor="#555"
                value={userLocation}
                onChangeText={setUserLocation}
              />
            </View>

            <View style={styles.radiusContainer}>
              <View style={styles.radiusLabel}>
                <Icon name="radar" size={20} color="#32CD32" />
                <Text style={styles.radiusText}>Alert Radius: {alertRadius} km</Text>
              </View>
              <View style={styles.radiusButtons}>
                {['1', '5', '10', '20'].map(radius => (
                  <TouchableOpacity
                    key={radius}
                    style={[styles.radiusButton, alertRadius === radius && styles.radiusButtonActive]}
                    onPress={() => setAlertRadius(radius)}
                  >
                    <Text style={[styles.radiusButtonText, alertRadius === radius && styles.radiusButtonTextActive]}>
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Crime Type Filters */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <Icon name="filter-list" size={24} color="#FFD93D" />
              <Text style={styles.sectionTitle}>Alert Filters</Text>
            </View>
            
            <View style={styles.filterGrid}>
              {Object.keys(selectedCrimeTypes).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    selectedCrimeTypes[type] && styles.filterChipActive,
                    { borderColor: getCrimeColor(type) }
                  ]}
                  onPress={() => toggleCrimeType(type)}
                >
                  <Icon 
                    name={getCrimeIcon(type)} 
                    size={20} 
                    color={selectedCrimeTypes[type] ? getCrimeColor(type) : '#555'} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    selectedCrimeTypes[type] && { color: getCrimeColor(type) }
                  ]}>
                    {type}
                  </Text>
                  {selectedCrimeTypes[type] && (
                    <Icon name="check-circle" size={16} color={getCrimeColor(type)} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Alert Statistics */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(50, 205, 50, 0.2)', 'rgba(50, 205, 50, 0.05)']} style={styles.statGradient}>
              <Icon name="notifications" size={28} color="#32CD32" />
              <Text style={styles.statValue}>{recentAlerts.length}</Text>
              <Text style={styles.statLabel}>Recent Alerts</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.05)']} style={styles.statGradient}>
              <Icon name="crisis-alert" size={28} color="#FF6B6B" />
              <Text style={styles.statValue}>
                {Object.values(selectedCrimeTypes).filter(v => v).length}
              </Text>
              <Text style={styles.statLabel}>Active Filters</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(255, 215, 61, 0.2)', 'rgba(255, 215, 61, 0.05)']} style={styles.statGradient}>
              <Icon name="location-searching" size={28} color="#FFD93D" />
              <Text style={styles.statValue}>{alertRadius}</Text>
              <Text style={styles.statLabel}>Radius (km)</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Recent Alerts Feed */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <Icon name="history" size={24} color="#00D9FF" />
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <View style={styles.alertCount}>
                <Text style={styles.alertCountText}>{recentAlerts.length}</Text>
              </View>
            </View>

            {recentAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="notifications-none" size={64} color="#333" />
                <Text style={styles.emptyText}>No recent alerts</Text>
                <Text style={styles.emptySubtext}>
                  {alertsEnabled ? 'You\'ll be notified when crimes occur in your area' : 'Enable alerts to start monitoring'}
                </Text>
              </View>
            ) : (
              recentAlerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <View style={[styles.alertIconContainer, { backgroundColor: `${getCrimeColor(alert.crime_type)}20` }]}>
                    <Icon name={getCrimeIcon(alert.crime_type)} size={24} color={getCrimeColor(alert.crime_type)} />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertType}>{alert.crime_type || 'Crime'}</Text>
                      <Text style={styles.alertTime}>{formatTimeAgo(alert.alertTime)}</Text>
                    </View>
                    <Text style={styles.alertLocation} numberOfLines={1}>
                      📍 {alert.location || 'Unknown location'}
                    </Text>
                    {alert.description && (
                      <Text style={styles.alertDescription} numberOfLines={2}>
                        {alert.description}
                      </Text>
                    )}
                  </View>
                  <Icon name="chevron-right" size={20} color="#555" />
                </View>
              ))
            )}
          </LinearGradient>
        </Animated.View>

        {/* Test Notification Button */}
        <Animated.View style={[styles.testButtonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await sendNotification({
                crime_type: 'Test Alert',
                location: userLocation || 'Your Location',
                description: 'This is a test notification to verify alerts are working.',
                _id: 'test',
              });
              Alert.alert('Test Alert Sent', 'Check your notifications!');
            }}
          >
            <LinearGradient colors={['#6C5CE7', '#5849c7']} style={styles.testButtonGradient}>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.testButtonText}>Send Test Alert</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Dashboard")}>
          <Icon name="dashboard" size={24} color="#888" />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("CrimeMap")}>
          <Icon name="map" size={24} color="#888" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <LinearGradient colors={['#FF6B6B', '#ff5252']} style={styles.fabButton}>
            <Icon name="notifications-active" size={28} color="#fff" />
          </LinearGradient>
          <Text style={[styles.navText, { color: '#FF6B6B' }]}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Analytics")}>
          <Icon name="bar-chart" size={24} color="#888" />
          <Text style={styles.navText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfileScreen")}>
          <Icon name="person" size={24} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#32CD32',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#32CD32',
  },
  masterCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  masterGradient: {
    padding: 20,
    borderWidth: 2,
    borderRadius: 20,
  },
  masterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  masterInfo: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  masterSubtext: {
    fontSize: 14,
    color: '#888',
  },
  lastCheckedText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  radiusContainer: {
    marginTop: 10,
  },
  radiusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  radiusText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderColor: '#32CD32',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  radiusButtonTextActive: {
    color: '#32CD32',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  alertCount: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  alertIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertTime: {
    fontSize: 12,
    color: '#888',
  },
  alertLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
  },
  testButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RealTimeCrimeAlertsScreen;
