import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

const SafeRouteScreen = () => {
  const navigation = useNavigation();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [crimeData, setCrimeData] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const startDebounceTimer = useRef(null);
  const endDebounceTimer = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCrimeData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for calculating
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  }, []);

  const fetchCrimeData = async () => {
    try {
      const response = await fetch('https://api-2-2-88x4.onrender.com/crimes');
      const data = await response.json();
      setCrimeData(data);
    } catch (error) {
      console.error('Error fetching crime data:', error);
    }
  };

  // Enhanced location matching function
  const matchLocation = (crimeLocation, searchLocation) => {
    const crimeLower = crimeLocation.toLowerCase();
    const searchLower = searchLocation.toLowerCase();
    
    // Exact match
    if (crimeLower === searchLower) return true;
    
    // Contains match
    if (crimeLower.includes(searchLower)) return true;
    
    // Split and match keywords
    const searchWords = searchLower.split(/[\s,]+/).filter(word => word.length > 2);
    const crimeWords = crimeLower.split(/[\s,]+/);
    
    // Check if all search words are present in crime location
    const matchCount = searchWords.filter(searchWord => 
      crimeWords.some(crimeWord => crimeWord.includes(searchWord) || searchWord.includes(crimeWord))
    ).length;
    
    // Return true if at least 70% of search words match
    return matchCount >= Math.ceil(searchWords.length * 0.7);
  };

  // Generate suggestions for start location (worldwide + crime data)
  const generateStartSuggestions = async (text) => {
    if (text.length < 2) {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
      return;
    }

    try {
      // Get worldwide location suggestions from OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CrimeSpotterApp/1.0'
          }
        }
      );
      const places = await response.json();
      const worldwidePlaces = places.map(place => place.display_name);
      
      // Also include matching crime locations
      const crimeLocations = crimeData
        .filter(crime => matchLocation(crime.location, text))
        .map(crime => crime.location)
        .filter((location, index, self) => self.indexOf(location) === index)
        .slice(0, 3);
      
      // Combine both
      const combined = [...crimeLocations, ...worldwidePlaces].slice(0, 8);
      
      setStartSuggestions(combined);
      setShowStartSuggestions(combined.length > 0);
    } catch (error) {
      // Fallback to crime data only
      const matchingLocations = crimeData
        .filter(crime => matchLocation(crime.location, text))
        .map(crime => crime.location)
        .filter((location, index, self) => self.indexOf(location) === index)
        .slice(0, 5);
      setStartSuggestions(matchingLocations);
      setShowStartSuggestions(matchingLocations.length > 0);
    }
  };

  // Generate suggestions for end location (worldwide + crime data)
  const generateEndSuggestions = async (text) => {
    if (text.length < 2) {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
      return;
    }

    try {
      // Get worldwide location suggestions from OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CrimeSpotterApp/1.0'
          }
        }
      );
      const places = await response.json();
      const worldwidePlaces = places.map(place => place.display_name);
      
      // Also include matching crime locations
      const crimeLocations = crimeData
        .filter(crime => matchLocation(crime.location, text))
        .map(crime => crime.location)
        .filter((location, index, self) => self.indexOf(location) === index)
        .slice(0, 3);
      
      // Combine both
      const combined = [...crimeLocations, ...worldwidePlaces].slice(0, 8);
      
      setEndSuggestions(combined);
      setShowEndSuggestions(combined.length > 0);
    } catch (error) {
      // Fallback to crime data only
      const matchingLocations = crimeData
        .filter(crime => matchLocation(crime.location, text))
        .map(crime => crime.location)
        .filter((location, index, self) => self.indexOf(location) === index)
        .slice(0, 5);
      setEndSuggestions(matchingLocations);
      setShowEndSuggestions(matchingLocations.length > 0);
    }
  };

  // Handle start location change with debounce
  const handleStartLocationChange = (text) => {
    setStartLocation(text);
    
    if (text.length < 2) {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
      if (startDebounceTimer.current) {
        clearTimeout(startDebounceTimer.current);
      }
      return;
    }
    
    // Show quick suggestions from crime data immediately
    const quickSuggestions = crimeData
      .filter(crime => matchLocation(crime.location, text))
      .map(crime => crime.location)
      .filter((location, index, self) => self.indexOf(location) === index)
      .slice(0, 5);
    
    if (quickSuggestions.length > 0) {
      setStartSuggestions(quickSuggestions);
      setShowStartSuggestions(true);
    }
    
    if (startDebounceTimer.current) {
      clearTimeout(startDebounceTimer.current);
    }
    
    startDebounceTimer.current = setTimeout(() => {
      generateStartSuggestions(text);
    }, 500);
  };

  // Handle end location change with debounce
  const handleEndLocationChange = (text) => {
    setEndLocation(text);
    
    if (text.length < 2) {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
      if (endDebounceTimer.current) {
        clearTimeout(endDebounceTimer.current);
      }
      return;
    }
    
    // Show quick suggestions from crime data immediately
    const quickSuggestions = crimeData
      .filter(crime => matchLocation(crime.location, text))
      .map(crime => crime.location)
      .filter((location, index, self) => self.indexOf(location) === index)
      .slice(0, 5);
    
    if (quickSuggestions.length > 0) {
      setEndSuggestions(quickSuggestions);
      setShowEndSuggestions(true);
    }
    
    if (endDebounceTimer.current) {
      clearTimeout(endDebounceTimer.current);
    }
    
    endDebounceTimer.current = setTimeout(() => {
      generateEndSuggestions(text);
    }, 500);
  };

  // Select start suggestion
  const selectStartSuggestion = (suggestion) => {
    setStartLocation(suggestion);
    setTimeout(() => {
      setShowStartSuggestions(false);
    }, 100);
  };

  // Select end suggestion
  const selectEndSuggestion = (suggestion) => {
    setEndLocation(suggestion);
    setTimeout(() => {
      setShowEndSuggestions(false);
    }, 100);
  };

  const calculateCrimeIncidents = (location) => {
    // Count crimes matching the location
    const matchingCrimes = crimeData.filter(crime => 
      matchLocation(crime.location, location)
    );
    return matchingCrimes.length;
  };

  const calculateRoutes = () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert('Missing Information', 'Please enter both start and end locations');
      return;
    }

    setIsCalculating(true);

    // Calculate crime incidents for start and end locations
    setTimeout(() => {
      const startCrimes = calculateCrimeIncidents(startLocation);
      const endCrimes = calculateCrimeIncidents(endLocation);
      const avgCrimes = Math.round((startCrimes + endCrimes) / 2);

      // Calculate routes based on actual crime data
      const baseCrimes = Math.max(1, avgCrimes);
      
      const calculatedRoutes = [
        {
          id: 1,
          name: 'Safest Route',
          distance: '12.5 km',
          duration: '28 mins',
          safetyScore: Math.max(70, 100 - (baseCrimes * 2)),
          crimeIncidents: Math.max(0, baseCrimes - 2),
          color: '#32CD32',
          coordinates: generateRouteCoordinates(13.0827, 80.2707, 13.0500, 80.2500, 0.02),
          type: 'safest',
        },
        {
          id: 2,
          name: 'Fastest Route',
          distance: '10.8 km',
          duration: '22 mins',
          safetyScore: Math.max(50, 100 - (baseCrimes * 5)),
          crimeIncidents: Math.max(0, baseCrimes + 4),
          color: '#FFD93D',
          coordinates: generateRouteCoordinates(13.0827, 80.2707, 13.0500, 80.2500, 0.01),
          type: 'fastest',
        },
        {
          id: 3,
          name: 'Balanced Route',
          distance: '11.2 km',
          duration: '25 mins',
          safetyScore: Math.max(60, 100 - (baseCrimes * 3)),
          crimeIncidents: Math.max(0, baseCrimes),
          color: '#6C5CE7',
          coordinates: generateRouteCoordinates(13.0827, 80.2707, 13.0500, 80.2500, 0.015),
          type: 'balanced',
        },
      ];

      setRoutes(calculatedRoutes);
      setSelectedRoute(calculatedRoutes[0]);
      setIsCalculating(false);
    }, 2000);
  };

  const generateRouteCoordinates = (startLat, startLng, endLat, endLng, variance) => {
    const coordinates = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const lat = startLat + (endLat - startLat) * (i / steps) + (Math.random() - 0.5) * variance;
      const lng = startLng + (endLng - startLng) * (i / steps) + (Math.random() - 0.5) * variance;
      coordinates.push({ latitude: lat, longitude: lng });
    }
    
    return coordinates;
  };

  const getSafetyColor = (score) => {
    if (score >= 85) return '#32CD32';
    if (score >= 70) return '#FFD93D';
    return '#FF6B6B';
  };

  const getSafetyLabel = (score) => {
    if (score >= 85) return 'Very Safe';
    if (score >= 70) return 'Moderately Safe';
    return 'Use Caution';
  };

  // Start Navigation
  const startNavigation = () => {
    if (!selectedRoute) {
      Alert.alert('No Route Selected', 'Please select a route first');
      return;
    }

    setIsNavigating(true);
    setCurrentPosition(0);
    
    // Parse distance and duration
    const distanceValue = parseFloat(selectedRoute.distance);
    const durationValue = parseInt(selectedRoute.duration);
    
    setRemainingDistance(distanceValue);
    setRemainingTime(durationValue);

    // Simulate real-time navigation updates
    simulateNavigation(distanceValue, durationValue);
  };

  // Simulate real-time navigation like Google Maps
  const simulateNavigation = (totalDistance, totalTime) => {
    let elapsed = 0;
    const updateInterval = 2000; // Update every 2 seconds
    const totalDuration = totalTime * 60 * 1000; // Convert to milliseconds

    const navigationInterval = setInterval(() => {
      elapsed += updateInterval;
      const progress = elapsed / totalDuration;

      if (progress >= 1) {
        clearInterval(navigationInterval);
        setIsNavigating(false);
        setCurrentPosition(selectedRoute.coordinates.length - 1);
        setRemainingDistance(0);
        setRemainingTime(0);
        Alert.alert('Navigation Complete', 'You have arrived at your destination!');
        return;
      }

      // Update current position
      const positionIndex = Math.floor(progress * (selectedRoute.coordinates.length - 1));
      setCurrentPosition(positionIndex);

      // Update remaining distance and time
      const remainingDist = totalDistance * (1 - progress);
      const remainingMins = Math.ceil(totalTime * (1 - progress));
      
      setRemainingDistance(remainingDist);
      setRemainingTime(remainingMins);
    }, updateInterval);
  };

  // Stop Navigation
  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentPosition(null);
    Alert.alert('Navigation Stopped', 'Navigation has been cancelled');
  };

  const renderRouteCard = (route) => (
    <TouchableOpacity
      key={route.id}
      onPress={() => setSelectedRoute(route)}
      style={[
        styles.routeCard,
        selectedRoute?.id === route.id && styles.routeCardSelected,
      ]}
    >
      <LinearGradient
        colors={
          selectedRoute?.id === route.id
            ? [`${route.color}30`, `${route.color}10`]
            : ['#1a1a1a', '#0f0f0f']
        }
        style={styles.routeCardGradient}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeIconContainer}>
            <Icon
              name={
                route.type === 'safest'
                  ? 'verified-user'
                  : route.type === 'fastest'
                  ? 'flash-on'
                  : 'route'
              }
              size={28}
              color={route.color}
            />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{route.name}</Text>
            <View style={styles.routeStats}>
              <Icon name="straighten" size={14} color="#888" />
              <Text style={styles.routeStatText}>{route.distance}</Text>
              <Icon name="schedule" size={14} color="#888" style={{ marginLeft: 12 }} />
              <Text style={styles.routeStatText}>{route.duration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.safetyScoreContainer}>
          <View style={styles.safetyScoreCircle}>
            <Text style={[styles.safetyScoreText, { color: getSafetyColor(route.safetyScore) }]}>
              {route.safetyScore}
            </Text>
            <Text style={styles.safetyScoreLabel}>Safety</Text>
          </View>
          <View style={styles.safetyDetails}>
            <View style={[styles.safetyBadge, { backgroundColor: `${getSafetyColor(route.safetyScore)}20` }]}>
              <Text style={[styles.safetyBadgeText, { color: getSafetyColor(route.safetyScore) }]}>
                {getSafetyLabel(route.safetyScore)}
              </Text>
            </View>
            <View style={styles.crimeIndicator}>
              <Icon name="warning" size={16} color="#FF6B6B" />
              <Text style={styles.crimeIndicatorText}>
                {route.crimeIncidents} incidents nearby
              </Text>
            </View>
          </View>
        </View>

        {selectedRoute?.id === route.id && (
          <>
            <View style={styles.selectedIndicator}>
              <Icon name="check-circle" size={20} color={route.color} />
              <Text style={[styles.selectedText, { color: route.color }]}>Selected Route</Text>
            </View>
            <TouchableOpacity
              style={styles.startNavButton}
              onPress={startNavigation}
            >
              <LinearGradient colors={[route.color, `${route.color}CC`]} style={styles.startNavButtonGradient}>
                <Icon name="navigation" size={22} color="#fff" />
                <Text style={styles.startNavButtonText}>Start Navigation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a0a', '#1a1a1a']} style={styles.gradient}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#32CD32" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Safe Route Planner</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Icon name="tune" size={24} color="#32CD32" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Navigate safely with crime-aware routing</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Location Input Section */}
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.inputCard}>
              <View style={styles.inputRow}>
                <View style={styles.inputIconContainer}>
                  <Icon name="my-location" size={20} color="#32CD32" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter start location"
                  placeholderTextColor="#666"
                  value={startLocation}
                  onChangeText={handleStartLocationChange}
                  onFocus={() => {
                    if (startLocation.length >= 2 && startSuggestions.length > 0) {
                      setShowStartSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowStartSuggestions(false), 200);
                  }}
                />
              </View>

              {/* Start Location Suggestions */}
              {showStartSuggestions && startSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {startSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      activeOpacity={0.7}
                      onPress={() => selectStartSuggestion(suggestion)}
                    >
                      <Icon name="location-on" size={16} color="#32CD32" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.inputDivider} />

              <View style={styles.inputRow}>
                <View style={styles.inputIconContainer}>
                  <Icon name="location-on" size={20} color="#FF6B6B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter destination"
                  placeholderTextColor="#666"
                  value={endLocation}
                  onChangeText={handleEndLocationChange}
                  onFocus={() => {
                    if (endLocation.length >= 2 && endSuggestions.length > 0) {
                      setShowEndSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowEndSuggestions(false), 200);
                  }}
                />
              </View>

              {/* End Location Suggestions */}
              {showEndSuggestions && endSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {endSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      activeOpacity={0.7}
                      onPress={() => selectEndSuggestion(suggestion)}
                    >
                      <Icon name="location-on" size={16} color="#FF6B6B" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateRoutes}
                disabled={isCalculating}
              >
                <LinearGradient colors={['#32CD32', '#28a428']} style={styles.calculateButtonGradient}>
                  {isCalculating ? (
                    <>
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Icon name="hourglass-empty" size={20} color="#fff" />
                      </Animated.View>
                      <Text style={styles.calculateButtonText}>Calculating Routes...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="directions" size={20} color="#fff" />
                      <Text style={styles.calculateButtonText}>Find Safe Routes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Routes List */}
          {routes.length > 0 && (
            <Animated.View style={[styles.routesSection, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Available Routes</Text>
              {routes.map((route) => renderRouteCard(route))}
            </Animated.View>
          )}

          {/* Safety Tips */}
          <Animated.View style={[styles.tipsSection, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Icon name="lightbulb" size={24} color="#FFD93D" />
                <Text style={styles.tipsTitle}>Safety Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <Icon name="check-circle" size={18} color="#32CD32" />
                  <Text style={styles.tipText}>Always choose well-lit, populated routes</Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon name="check-circle" size={18} color="#32CD32" />
                  <Text style={styles.tipText}>Stay alert and avoid distractions</Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon name="check-circle" size={18} color="#32CD32" />
                  <Text style={styles.tipText}>Share your route with trusted contacts</Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon name="check-circle" size={18} color="#32CD32" />
                  <Text style={styles.tipText}>Trust your instincts and reroute if needed</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Real-time Navigation Overlay */}
        {isNavigating && selectedRoute && (
          <View style={styles.navigationOverlay}>
            <LinearGradient colors={['#000000EE', '#0a0a0aEE']} style={styles.navigationContainer}>
              {/* Navigation Header */}
              <View style={styles.navHeader}>
                <View style={styles.navInfoBox}>
                  <Icon name="navigation" size={24} color="#32CD32" />
                  <Text style={styles.navTitle}>Navigating via {selectedRoute.name}</Text>
                </View>
                <TouchableOpacity onPress={stopNavigation} style={styles.stopNavButton}>
                  <Icon name="close" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              {/* Current Location and Destination */}
              <View style={styles.navLocations}>
                <View style={styles.navLocationItem}>
                  <Icon name="my-location" size={20} color="#32CD32" />
                  <Text style={styles.navLocationText}>{startLocation}</Text>
                </View>
                <View style={styles.navDivider} />
                <View style={styles.navLocationItem}>
                  <Icon name="location-on" size={20} color="#FF6B6B" />
                  <Text style={styles.navLocationText}>{endLocation}</Text>
                </View>
              </View>

              {/* Real-time Stats */}
              <View style={styles.navStatsContainer}>
                <View style={styles.navStatCard}>
                  <Icon name="straighten" size={28} color="#32CD32" />
                  <Text style={styles.navStatValue}>{remainingDistance.toFixed(1)} km</Text>
                  <Text style={styles.navStatLabel}>Remaining</Text>
                </View>
                <View style={styles.navStatCard}>
                  <Icon name="schedule" size={28} color="#FFD93D" />
                  <Text style={styles.navStatValue}>{remainingTime} min</Text>
                  <Text style={styles.navStatLabel}>ETA</Text>
                </View>
                <View style={styles.navStatCard}>
                  <Icon name="security" size={28} color={getSafetyColor(selectedRoute.safetyScore)} />
                  <Text style={styles.navStatValue}>{selectedRoute.safetyScore}</Text>
                  <Text style={styles.navStatLabel}>Safety Score</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.navProgressContainer}>
                <View style={styles.navProgressBar}>
                  <LinearGradient
                    colors={['#32CD32', '#28a428']}
                    style={[
                      styles.navProgressFill,
                      {
                        width: `${currentPosition !== null ? (currentPosition / (selectedRoute.coordinates.length - 1)) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.navProgressText}>
                  {currentPosition !== null
                    ? `${Math.round((currentPosition / (selectedRoute.coordinates.length - 1)) * 100)}% Complete`
                    : '0% Complete'}
                </Text>
              </View>

              {/* Live Updates */}
              <View style={styles.navLiveIndicator}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Icon name="fiber-manual-record" size={12} color="#FF6B6B" />
                </Animated.View>
                <Text style={styles.navLiveText}>LIVE</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Icon name="home" size={26} color="#888" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CrimeMap')}>
            <Icon name="map" size={26} color="#888" />
            <Text style={styles.navText}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={() => navigation.navigate('SafeRoute')}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="directions" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Analytics')}>
            <Icon name="bar-chart" size={26} color="#888" />
            <Text style={styles.navText}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileScreen')}>
            <Icon name="person" size={26} color="#888" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    marginVertical: 15,
  },
  calculateButton: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  calculateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  routeCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  routeCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  routeCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 15,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStatText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 5,
  },
  safetyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.1)',
  },
  safetyScoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  safetyScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  safetyScoreLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  safetyDetails: {
    flex: 1,
  },
  safetyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  safetyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  crimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crimeIndicatorText: {
    fontSize: 13,
    color: '#888',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.2)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 5,
  },
  navText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 40,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.3)',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(50, 205, 50, 0.1)',
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  startNavButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startNavButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  startNavButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    zIndex: 1000,
  },
  navigationContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  navTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  stopNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLocations: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.3)',
  },
  navLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  navLocationText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  navDivider: {
    height: 1,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    marginVertical: 8,
  },
  navStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  navStatCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.3)',
  },
  navStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  navStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  navProgressContainer: {
    marginBottom: 20,
  },
  navProgressBar: {
    height: 8,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  navProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  navProgressText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  navLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  navLiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 1,
  },
});

export default SafeRouteScreen;
