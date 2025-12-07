import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

const CrimeTrendsScreen = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [crimeData, setCrimeData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const periods = [
    { id: 'daily', label: 'Daily', icon: 'today', color: '#32CD32' },
    { id: 'weekly', label: 'Weekly', icon: 'date-range', color: '#FFD93D' },
    { id: 'monthly', label: 'Monthly', icon: 'calendar-today', color: '#FF6B6B' },
    { id: 'yearly', label: 'Yearly', icon: 'event', color: '#6C5CE7' },
  ];

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

    // Pulse animation for live indicator
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

    // Set up real-time updates - fetch data every 10 seconds
    const intervalId = setInterval(() => {
      fetchCrimeData();
    }, 10000); // 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    analyzeTrends();
  }, [selectedPeriod, crimeData]);

  const fetchCrimeData = async () => {
    try {
      if (!isLoading) {
        setIsLoading(true);
      }
      setIsUpdating(true);
      
      const response = await fetch('https://api-2-2-88x4.onrender.com/crimes');
      const data = await response.json();
      
      console.log('Fetched crime data:', data.length, 'crimes');
      
      // Ensure all crimes have a valid date (use current date if missing)
      const processedData = data.map(crime => ({
        ...crime,
        date: crime.date || crime.createdAt || new Date().toISOString(),
      }));
      
      console.log('Processed crime data with dates');
      
      setCrimeData(processedData);
      setLastUpdated(new Date());
      setIsLoading(false);
      setIsUpdating(false);
    } catch (error) {
      console.error('Error fetching crime data:', error);
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // seconds
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const analyzeTrends = () => {
    if (crimeData.length === 0) {
      console.log('No crime data to analyze');
      return;
    }

    console.log('Analyzing trends for', selectedPeriod, 'with', crimeData.length, 'crimes');
    
    const now = new Date();
    let filteredData = [];
    let labels = [];
    let dataPoints = [];

    switch (selectedPeriod) {
      case 'daily':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayData = crimeData.filter(crime => {
            const crimeDate = new Date(crime.date || crime.createdAt);
            return crimeDate.toDateString() === date.toDateString();
          });
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
          dataPoints.push(dayData.length);
          filteredData.push(...dayData);
        }
        break;

      case 'weekly':
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const weekData = crimeData.filter(crime => {
            const crimeDate = new Date(crime.date || crime.createdAt);
            return crimeDate >= weekStart && crimeDate < weekEnd;
          });
          labels.push(`W${8 - i}`);
          dataPoints.push(weekData.length);
          filteredData.push(...weekData);
        }
        break;

      case 'monthly':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now);
          month.setMonth(month.getMonth() - i);
          const monthData = crimeData.filter(crime => {
            const crimeDate = new Date(crime.date || crime.createdAt);
            return crimeDate.getMonth() === month.getMonth() && 
                   crimeDate.getFullYear() === month.getFullYear();
          });
          labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
          dataPoints.push(monthData.length);
          filteredData.push(...monthData);
        }
        break;

      case 'yearly':
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const yearData = crimeData.filter(crime => {
            const crimeDate = new Date(crime.date || crime.createdAt);
            return crimeDate.getFullYear() === year;
          });
          labels.push(year.toString());
          dataPoints.push(yearData.length);
          filteredData.push(...yearData);
        }
        break;
    }

    // Calculate trend
    const recentAvg = dataPoints.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousAvg = dataPoints.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    const trendPercentage = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1) : 0;
    const isIncreasing = trendPercentage > 0;

    // Find hotspots
    const locationCounts = {};
    filteredData.forEach(crime => {
      const location = crime.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const hotspots = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Crime type distribution
    const typeCount = {};
    filteredData.forEach(crime => {
      const type = crime.type || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const topCrimes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count, percentage: ((count / filteredData.length) * 100).toFixed(1) }));

    console.log('Trend Analysis Results:', {
      totalCrimes: filteredData.length,
      trendPercentage,
      isIncreasing,
      dataPoints,
      hotspots: hotspots.length,
      topCrimes: topCrimes.length
    });

    setTrendAnalysis({
      labels,
      dataPoints,
      trendPercentage,
      isIncreasing,
      totalCrimes: filteredData.length,
      hotspots,
      topCrimes,
      avgPerPeriod: (filteredData.length / dataPoints.length).toFixed(1),
    });
  };

  const getTrendColor = () => {
    if (!trendAnalysis) return '#888';
    return trendAnalysis.isIncreasing ? '#FF6B6B' : '#32CD32';
  };

  const getTrendIcon = () => {
    if (!trendAnalysis) return 'trending-flat';
    return trendAnalysis.isIncreasing ? 'trending-up' : 'trending-down';
  };

  const getCrimeTypeIcon = (type) => {
    const icons = {
      'Theft': 'shopping-bag',
      'Assault': 'dangerous',
      'Burglary': 'home',
      'Robbery': 'money-off',
      'Vandalism': 'broken-image',
      'Vehicle Theft': 'directions-car',
    };
    return icons[type] || 'report';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a0a', '#1a1a1a']} style={styles.gradient}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#32CD32" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crime Trends</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchCrimeData}>
              <Icon name="refresh" size={24} color="#32CD32" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Analyze patterns and predict future risks</Text>
          
          {/* Real-time Indicator */}
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.liveDotInner} />
            </Animated.View>
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.lastUpdatedText}>• Updated {formatLastUpdated()}</Text>
            {isUpdating && (
              <View style={styles.updatingIndicator}>
                <Icon name="sync" size={14} color="#FFD93D" />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.periodsContainer}
          contentContainerStyle={styles.periodsContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              onPress={() => setSelectedPeriod(period.id)}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && { backgroundColor: `${period.color}20` }
              ]}
            >
              <Icon 
                name={period.icon} 
                size={20} 
                color={selectedPeriod === period.id ? period.color : '#888'} 
              />
              <Text 
                style={[
                  styles.periodText,
                  selectedPeriod === period.id && { color: period.color, fontWeight: 'bold' }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {trendAnalysis && !isLoading && (
            <>
              {/* Trend Overview */}
              <Animated.View style={[styles.overviewCard, { opacity: fadeAnim }]}>
                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.overviewGradient}>
                  <View style={styles.overviewHeader}>
                    <Icon name="insights" size={28} color="#32CD32" />
                    <Text style={styles.overviewTitle}>Trend Overview</Text>
                  </View>

                  <View style={styles.trendIndicator}>
                    <Icon name={getTrendIcon()} size={48} color={getTrendColor()} />
                    <View style={styles.trendTextContainer}>
                      <Text style={[styles.trendPercentage, { color: getTrendColor() }]}>
                        {Math.abs(trendAnalysis.trendPercentage)}%
                      </Text>
                      <Text style={styles.trendLabel}>
                        {trendAnalysis.isIncreasing ? 'Increase' : 'Decrease'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{trendAnalysis.totalCrimes}</Text>
                      <Text style={styles.statLabel}>Total Incidents</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{trendAnalysis.avgPerPeriod}</Text>
                      <Text style={styles.statLabel}>Avg per Period</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Chart */}
              <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Crime Frequency Timeline</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: trendAnalysis.labels,
                      datasets: [{ data: trendAnalysis.dataPoints }],
                    }}
                    width={Math.max(Dimensions.get('window').width - 40, trendAnalysis.labels.length * 50)}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#0a0a0a',
                      backgroundGradientFrom: '#1a1a1a',
                      backgroundGradientTo: '#0f0f0f',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: '6',
                        strokeWidth: '2',
                        stroke: '#32CD32',
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              </Animated.View>

              {/* Hotspots */}
              <Animated.View style={[styles.hotspotsCard, { opacity: fadeAnim }]}>
                <View style={styles.sectionHeader}>
                  <Icon name="location-on" size={24} color="#FF6B6B" />
                  <Text style={styles.sectionTitle}>Crime Hotspots</Text>
                </View>
                {trendAnalysis.hotspots.map((hotspot, index) => (
                  <View key={index} style={styles.hotspotItem}>
                    <View style={styles.hotspotRank}>
                      <Text style={styles.hotspotRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.hotspotInfo}>
                      <Text style={styles.hotspotLocation}>{hotspot.location}</Text>
                      <View style={styles.hotspotBar}>
                        <View 
                          style={[
                            styles.hotspotBarFill, 
                            { 
                              width: `${(hotspot.count / trendAnalysis.hotspots[0].count) * 100}%`,
                              backgroundColor: '#FF6B6B',
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={styles.hotspotCount}>{hotspot.count}</Text>
                  </View>
                ))}
              </Animated.View>

              {/* Crime Types */}
              <Animated.View style={[styles.typesCard, { opacity: fadeAnim }]}>
                <View style={styles.sectionHeader}>
                  <Icon name="category" size={24} color="#FFD93D" />
                  <Text style={styles.sectionTitle}>Crime Types Distribution</Text>
                </View>
                {trendAnalysis.topCrimes.map((crime, index) => (
                  <View key={index} style={styles.crimeTypeItem}>
                    <View style={styles.crimeTypeIcon}>
                      <Icon name={getCrimeTypeIcon(crime.type)} size={24} color="#FFD93D" />
                    </View>
                    <View style={styles.crimeTypeInfo}>
                      <View style={styles.crimeTypeHeader}>
                        <Text style={styles.crimeTypeName}>{crime.type}</Text>
                        <Text style={styles.crimeTypePercentage}>{crime.percentage}%</Text>
                      </View>
                      <View style={styles.crimeTypeBar}>
                        <LinearGradient
                          colors={['#FFD93D', '#FFB93D']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.crimeTypeBarFill, { width: `${crime.percentage}%` }]}
                        />
                      </View>
                      <Text style={styles.crimeTypeCount}>{crime.count} incidents</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>

              {/* Predictions */}
              <Animated.View style={[styles.predictionCard, { opacity: fadeAnim }]}>
                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.predictionGradient}>
                  <View style={styles.sectionHeader}>
                    <Icon name="trending-up" size={24} color="#6C5CE7" />
                    <Text style={styles.sectionTitle}>Predictive Analysis</Text>
                  </View>
                  <Text style={styles.predictionText}>
                    Based on current trends, crime rates are expected to{' '}
                    <Text style={{ color: getTrendColor(), fontWeight: 'bold' }}>
                      {trendAnalysis.isIncreasing ? 'increase' : 'decrease'}
                    </Text>
                    {' '}by approximately{' '}
                    <Text style={{ color: getTrendColor(), fontWeight: 'bold' }}>
                      {Math.abs(trendAnalysis.trendPercentage)}%
                    </Text>
                    {' '}in the next period.
                  </Text>
                  <View style={styles.recommendationBox}>
                    <Icon name="info" size={20} color="#6C5CE7" />
                    <Text style={styles.recommendationText}>
                      {trendAnalysis.isIncreasing 
                        ? 'Stay extra vigilant and follow safety guidelines closely.'
                        : 'Crime rates are improving! Continue maintaining awareness.'}
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              <View style={{ height: 100 }} />
            </>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Icon name="hourglass-empty" size={48} color="#32CD32" />
              <Text style={styles.loadingText}>Analyzing crime trends...</Text>
            </View>
          )}
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

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={() => navigation.navigate('CrimeTrends')}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="timeline" size={32} color="#fff" />
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
  refreshButton: {
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
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.3)',
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(50, 205, 50, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32CD32',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#32CD32',
    letterSpacing: 1,
    marginRight: 8,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  updatingIndicator: {
    marginLeft: 8,
  },
  periodsContainer: {
    maxHeight: 60,
  },
  periodsContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 10,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    gap: 8,
  },
  periodText: {
    fontSize: 14,
    color: '#888',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  overviewCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  trendTextContainer: {
    alignItems: 'flex-start',
  },
  trendPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  trendLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.1)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#32CD32',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
  },
  chartCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  hotspotsCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  hotspotRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotLocation: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '600',
  },
  hotspotBar: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hotspotBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hotspotCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    minWidth: 40,
    textAlign: 'right',
  },
  typesCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.2)',
  },
  crimeTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  crimeTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crimeTypeInfo: {
    flex: 1,
  },
  crimeTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  crimeTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  crimeTypePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD93D',
  },
  crimeTypeBar: {
    height: 8,
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  crimeTypeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  crimeTypeCount: {
    fontSize: 12,
    color: '#888',
  },
  predictionCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  predictionGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    borderRadius: 20,
  },
  predictionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 15,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
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
});

export default CrimeTrendsScreen;
