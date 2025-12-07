import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const CrimePredictorScreen = () => {
  const navigation = useNavigation();
  const [crimes, setCrimes] = useState([]);
  const [location, setLocation] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCrimes();
    
    // Start animations
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

    // Pulse animation for risk score
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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

  const fetchCrimes = async () => {
    try {
      const response = await fetch('https://api-2-2-88x4.onrender.com/crimes');
      const data = await response.json();
      setCrimes(data);
    } catch (error) {
      console.error('Error fetching crimes:', error);
    }
  };

  // Generate location suggestions from worldwide places + crime data
  const generateSuggestions = async (text) => {
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Get suggestions from OpenStreetMap Nominatim API (free, worldwide)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CrimeSpotterApp/1.0'
          }
        }
      );
      const places = await response.json();
      
      // Format the results
      const worldwidePlaces = places.map(place => place.display_name);
      
      // Also include matching locations from crime data
      const uniqueLocations = [...new Set(crimes.map(crime => crime.location))];
      const crimeLocations = uniqueLocations
        .filter(loc => loc.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 3);
      
      // Combine both (crime locations first, then worldwide)
      const combined = [...crimeLocations, ...worldwidePlaces].slice(0, 8);
      
      setSuggestions(combined);
      setShowSuggestions(combined.length > 0);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback to crime data only
      const uniqueLocations = [...new Set(crimes.map(crime => crime.location))];
      const filtered = uniqueLocations
        .filter(loc => loc.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      return;
    }
    
    // Show suggestions immediately from crime data while waiting for API
    const uniqueLocations = [...new Set(crimes.map(crime => crime.location))];
    const quickSuggestions = uniqueLocations
      .filter(loc => loc.toLowerCase().includes(text.toLowerCase()))
      .slice(0, 5);
    
    if (quickSuggestions.length > 0) {
      setSuggestions(quickSuggestions);
      setShowSuggestions(true);
    }
    
    // Debounce API calls - wait 500ms after user stops typing
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      generateSuggestions(text);
    }, 500);
  };

  const selectSuggestion = (suggestion) => {
    setLocation(suggestion);
    // Close suggestions immediately
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    }, 100);
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

  // AI Crime Prediction Algorithm
  const predictCrimeRisk = (searchLocation) => {
    if (!searchLocation || crimes.length === 0) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);

    // Filter crimes by location (enhanced fuzzy match)
    const locationCrimes = crimes.filter(crime => 
      matchLocation(crime.location, searchLocation)
    );

    // Calculate crime frequency by type
    const crimeTypes = {};
    locationCrimes.forEach(crime => {
      const type = crime.crime_type;
      crimeTypes[type] = (crimeTypes[type] || 0) + 1;
    });

    // Calculate risk score (0-100)
    const totalCrimes = locationCrimes.length;
    const riskScore = Math.min(100, Math.round((totalCrimes / crimes.length) * 100 * 10));
    
    // Determine risk level
    let riskLevel = 'Low';
    let riskColor = '#32CD32';
    if (riskScore > 70) {
      riskLevel = 'High';
      riskColor = '#e94560';
    } else if (riskScore > 40) {
      riskLevel = 'Medium';
      riskColor = '#FFD93D';
    }

    // Find most common crime type
    const mostCommonCrime = Object.keys(crimeTypes).length > 0
      ? Object.entries(crimeTypes).sort((a, b) => b[1] - a[1])[0]
      : null;

    // Time analysis (best/worst times)
    const timeAnalysis = analyzeTimePatterns(locationCrimes);

    // Prediction confidence
    const confidence = totalCrimes > 0 ? Math.min(95, 60 + (totalCrimes * 5)) : 0;

    setTimeout(() => {
      setPrediction({
        location: searchLocation,
        riskScore,
        riskLevel,
        riskColor,
        totalIncidents: totalCrimes,
        crimeTypes,
        mostCommonCrime,
        timeAnalysis,
        confidence,
        recommendations: generateRecommendations(riskLevel, mostCommonCrime),
      });
      setLoading(false);
    }, 1500); // Simulate AI processing
  };

  const analyzeTimePatterns = (locationCrimes) => {
    // Simplified time analysis
    if (locationCrimes.length === 0) {
      return {
        safestTime: 'Morning (6 AM - 12 PM)',
        riskiestTime: 'Late Night (12 AM - 6 AM)',
      };
    }

    // In a real app, you'd analyze actual timestamps
    // For now, return general patterns
    return {
      safestTime: 'Morning (6 AM - 12 PM)',
      riskiestTime: 'Late Night (12 AM - 6 AM)',
      weekdayRisk: 'Medium',
      weekendRisk: 'High',
    };
  };

  const generateRecommendations = (riskLevel, mostCommonCrime) => {
    const recommendations = [];

    if (riskLevel === 'High') {
      recommendations.push('⚠️ Avoid this area during late hours');
      recommendations.push('👥 Travel in groups when possible');
      recommendations.push('📱 Keep emergency contacts ready');
    } else if (riskLevel === 'Medium') {
      recommendations.push('⚡ Stay alert and aware of surroundings');
      recommendations.push('🌙 Extra caution during nighttime');
      recommendations.push('🚶 Stick to well-lit areas');
    } else {
      recommendations.push('✅ Generally safe area');
      recommendations.push('👀 Maintain normal vigilance');
      recommendations.push('📍 Good location for activities');
    }

    if (mostCommonCrime) {
      recommendations.push(`🎯 Most common: ${mostCommonCrime[0]} - Take precautions`);
    }

    return recommendations;
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'check-circle';
      default: return 'help';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a0a', '#1a1a1a']} style={styles.gradient}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color="#32CD32" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>AI Crime Predictor</Text>
              <View style={{ width: 40 }} />
            </View>
            <Text style={styles.headerSubtitle}>Predict crime risk for any location</Text>
          </Animated.View>

          {/* Search Section */}
          <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.searchCard}>
              <View style={styles.searchHeader}>
                <Icon name="location-searching" size={28} color="#32CD32" />
                <Text style={styles.searchTitle}>Enter Location</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Icon name="place" size={20} color="#32CD32" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Guindy, Chennai"
                  placeholderTextColor="#666"
                  value={location}
                  onChangeText={handleLocationChange}
                  onFocus={() => {
                    if (location.length >= 2 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click to register
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
              </View>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      activeOpacity={0.7}
                      onPress={() => selectSuggestion(suggestion)}
                    >
                      <Icon name="location-on" size={16} color="#32CD32" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.predictButton}
                onPress={() => predictCrimeRisk(location)}
                disabled={loading}
              >
                <LinearGradient colors={['#32CD32', '#28a428']} style={styles.predictButtonGradient}>
                  {loading ? (
                    <>
                      <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                        <Icon name="sync" size={22} color="#fff" />
                      </Animated.View>
                      <Text style={styles.predictButtonText}>Analyzing...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="psychology" size={22} color="#fff" />
                      <Text style={styles.predictButtonText}>Predict Risk</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Prediction Results */}
          {prediction && (
            <Animated.View style={[styles.resultsSection, { opacity: fadeAnim }]}>
              {/* Risk Score Card */}
              <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.riskCard}>
                <Text style={styles.resultLocation}>📍 {prediction.location}</Text>
                
                <Animated.View style={[styles.riskScoreContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={[styles.riskCircle, { borderColor: prediction.riskColor }]}>
                    <Text style={[styles.riskScoreText, { color: prediction.riskColor }]}>
                      {prediction.riskScore}
                    </Text>
                    <Text style={styles.riskScoreLabel}>Risk Score</Text>
                  </View>
                </Animated.View>

                <View style={styles.riskLevelContainer}>
                  <Icon name={getRiskIcon(prediction.riskLevel)} size={32} color={prediction.riskColor} />
                  <Text style={[styles.riskLevelText, { color: prediction.riskColor }]}>
                    {prediction.riskLevel} Risk
                  </Text>
                </View>

                <View style={styles.confidenceBar}>
                  <Text style={styles.confidenceLabel}>Prediction Confidence: {prediction.confidence}%</Text>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={['#32CD32', '#28a428']}
                      style={[styles.progressFill, { width: `${prediction.confidence}%` }]}
                    />
                  </View>
                </View>
              </LinearGradient>

              {/* Statistics Cards */}
              <View style={styles.statsRow}>
                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statCard}>
                  <Icon name="report" size={28} color="#FF6B6B" />
                  <Text style={styles.statNumber}>{prediction.totalIncidents}</Text>
                  <Text style={styles.statLabel}>Total Incidents</Text>
                </LinearGradient>

                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statCard}>
                  <Icon name="category" size={28} color="#FFD93D" />
                  <Text style={styles.statNumber}>{Object.keys(prediction.crimeTypes).length}</Text>
                  <Text style={styles.statLabel}>Crime Types</Text>
                </LinearGradient>
              </View>

              {/* Most Common Crime */}
              {prediction.mostCommonCrime && (
                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Icon name="trending-up" size={24} color="#e94560" />
                    <Text style={styles.infoTitle}>Most Common Crime</Text>
                  </View>
                  <View style={styles.crimeTypeRow}>
                    <Text style={styles.crimeTypeName}>{prediction.mostCommonCrime[0]}</Text>
                    <Text style={styles.crimeTypeCount}>{prediction.mostCommonCrime[1]} incidents</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Time Analysis */}
              <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Icon name="schedule" size={24} color="#6C5CE7" />
                  <Text style={styles.infoTitle}>Time Analysis</Text>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Icon name="wb-sunny" size={20} color="#32CD32" />
                    <Text style={styles.timeLabel}>Safest Time</Text>
                    <Text style={styles.timeValue}>{prediction.timeAnalysis.safestTime}</Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeItem}>
                    <Icon name="brightness-3" size={20} color="#e94560" />
                    <Text style={styles.timeLabel}>Riskiest Time</Text>
                    <Text style={styles.timeValue}>{prediction.timeAnalysis.riskiestTime}</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Recommendations */}
              <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Icon name="lightbulb" size={24} color="#FFD93D" />
                  <Text style={styles.infoTitle}>Safety Recommendations</Text>
                </View>
                {prediction.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Icon name="arrow-right" size={18} color="#32CD32" />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </LinearGradient>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

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

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={() => navigation.navigate('CrimePredictor')}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="psychology" size={32} color="#fff" />
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
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
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
  searchSection: {
    marginBottom: 25,
  },
  searchCard: {
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 15,
  },
  predictButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  predictButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    gap: 15,
  },
  riskCard: {
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    alignItems: 'center',
  },
  resultLocation: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 25,
  },
  riskScoreContainer: {
    marginBottom: 25,
  },
  riskCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  riskScoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  riskScoreLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  riskLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confidenceBar: {
    width: '100%',
    marginTop: 10,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#32CD32',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  crimeTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  crimeTypeName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  crimeTypeCount: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
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
});

export default CrimePredictorScreen;
