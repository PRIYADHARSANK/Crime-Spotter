import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const AnalyticsDashboardScreen = () => {
  const navigation = useNavigation();
  const [crimeData, setCrimeData] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countUpAnims = useRef({
    total: new Animated.Value(0),
    today: new Animated.Value(0),
    thisWeek: new Animated.Value(0),
    thisMonth: new Animated.Value(0),
  }).current;
  
  // Track if initial load is complete
  const isInitialLoad = useRef(true);

  const screenWidth = Dimensions.get('window').width;

  const timeRanges = [
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'week', label: 'This Week', icon: 'date-range' },
    { id: 'month', label: 'This Month', icon: 'calendar-today' },
    { id: 'year', label: 'This Year', icon: 'event' },
  ];

  useEffect(() => {
    fetchCrimeData();
    
    // Animations
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

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    // Real-time updates every 5 seconds
    const intervalId = setInterval(() => {
      fetchCrimeData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (crimeData.length > 0) {
      calculateStats();
      isInitialLoad.current = false;
    }
  }, [crimeData, selectedTimeRange]);

  const fetchCrimeData = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('https://api-2-2-88x4.onrender.com/crimes');
      const data = await response.json();
      
      const processedData = data.map(crime => ({
        ...crime,
        date: crime.date || crime.createdAt || new Date().toISOString(),
      }));
      
      // Only update if data count or content changed (faster comparison)
      const hasChanged = crimeData.length !== processedData.length || 
                        crimeData.length === 0;
      
      if (hasChanged) {
        setCrimeData(processedData);
      }
      setLastUpdated(new Date());
      setIsUpdating(false);
    } catch (error) {
      console.error('Error fetching crime data:', error);
      setIsUpdating(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    
    // Filter by time range
    const filteredData = crimeData.filter(crime => {
      const crimeDate = new Date(crime.date);
      switch (selectedTimeRange) {
        case 'today':
          return crimeDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return crimeDate >= weekAgo;
        case 'month':
          return crimeDate.getMonth() === now.getMonth() && 
                 crimeDate.getFullYear() === now.getFullYear();
        case 'year':
          return crimeDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Today's crimes
    const todayCrimes = crimeData.filter(crime => {
      const crimeDate = new Date(crime.date);
      return crimeDate.toDateString() === now.toDateString();
    });

    // This week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCrimes = crimeData.filter(crime => new Date(crime.date) >= weekAgo);

    // This month
    const monthCrimes = crimeData.filter(crime => {
      const crimeDate = new Date(crime.date);
      return crimeDate.getMonth() === now.getMonth() && 
             crimeDate.getFullYear() === now.getFullYear();
    });

    // Crime types distribution
    const crimeTypes = {};
    filteredData.forEach(crime => {
      const type = crime.crime_type || 'Unknown';
      crimeTypes[type] = (crimeTypes[type] || 0) + 1;
    });

    // Top 5 crime types
    const topCrimeTypes = Object.entries(crimeTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Locations hotspots
    const locationCounts = {};
    filteredData.forEach(crime => {
      const loc = crime.location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Hourly distribution (last 24 hours)
    const hourlyData = new Array(24).fill(0);
    filteredData.forEach(crime => {
      const hour = new Date(crime.date).getHours();
      hourlyData[hour]++;
    });

    // Daily trend (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const count = crimeData.filter(crime => {
        const crimeDate = new Date(crime.date);
        return crimeDate.toDateString() === date.toDateString();
      }).length;
      dailyTrend.push(count);
    }

    // Calculate growth rates
    const yesterdayCount = crimeData.filter(crime => {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(crime.date).toDateString() === yesterday.toDateString();
    }).length;

    const todayGrowth = yesterdayCount === 0 ? 0 : 
      (((todayCrimes.length - yesterdayCount) / yesterdayCount) * 100).toFixed(1);

    const stats = {
      total: crimeData.length,
      today: todayCrimes.length,
      thisWeek: weekCrimes.length,
      thisMonth: monthCrimes.length,
      filtered: filteredData.length,
      topCrimeTypes,
      topLocations,
      hourlyData,
      dailyTrend,
      todayGrowth,
      crimeTypes,
    };

    setStats(stats);

    // Animate count-up only if values changed
    animateCountUp('total', crimeData.length);
    animateCountUp('today', todayCrimes.length);
    animateCountUp('thisWeek', weekCrimes.length);
    animateCountUp('thisMonth', monthCrimes.length);
  };

  const animateCountUp = (key, value) => {
    // Get current value instead of resetting to 0
    const currentValue = countUpAnims[key]._value;
    
    // Only animate if value changed
    if (currentValue !== value) {
      // On initial load, set value immediately to avoid showing 0
      if (isInitialLoad.current) {
        countUpAnims[key].setValue(value);
      } else {
        // Smooth transition for updates
        Animated.timing(countUpAnims[key], {
          toValue: value,
          duration: 600, // Fast and smooth (was 800)
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#0a0a0a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#32CD32',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#0a0a0a', '#1a1a1a']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon name="analytics" size={64} color="#32CD32" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading Analytics...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0a0a0a', '#1a1a1a']} style={styles.gradient}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#32CD32" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Icon name="analytics" size={28} color="#32CD32" />
              <Text style={styles.headerTitle}>Analytics Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchCrimeData}>
              <Icon name="refresh" size={24} color="#32CD32" />
            </TouchableOpacity>
          </View>
          
          {/* Live Indicator */}
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.liveDotInner} />
            </Animated.View>
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.lastUpdatedText}>• Updated {formatLastUpdated()}</Text>
            {isUpdating && (
              <Animated.View style={{ marginLeft: 8, transform: [{ rotate: '360deg' }] }}>
                <Icon name="sync" size={14} color="#FFD93D" />
              </Animated.View>
            )}
          </View>
        </Animated.View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Time Range Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.timeRangeContainer}
            contentContainerStyle={styles.timeRangeContent}
          >
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === range.id && styles.timeRangeButtonActive
                ]}
                onPress={() => setSelectedTimeRange(range.id)}
              >
                <Icon 
                  name={range.icon} 
                  size={20} 
                  color={selectedTimeRange === range.id ? '#fff' : '#888'} 
                />
                <Text style={[
                  styles.timeRangeText,
                  selectedTimeRange === range.id && styles.timeRangeTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Key Metrics Cards */}
          <View style={styles.metricsGrid}>
            <Animated.View style={[styles.metricCard, styles.metricCardLarge]}>
              <LinearGradient 
                colors={['#32CD32', '#28a428']} 
                style={styles.metricGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Icon name="security" size={32} color="#fff" />
                <Animated.Text style={styles.metricValue}>
                  {countUpAnims.total}
                </Animated.Text>
                <Text style={styles.metricLabel}>Total Crimes</Text>
                <Text style={styles.metricSubtext}>All time</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={styles.metricCard}>
              <LinearGradient 
                colors={['#FF6B6B', '#e94560']} 
                style={styles.metricGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Icon name="warning" size={28} color="#fff" />
                <Animated.Text style={styles.metricValueSmall}>
                  {countUpAnims.today}
                </Animated.Text>
                <Text style={styles.metricLabelSmall}>Today</Text>
                {stats.todayGrowth !== 0 && (
                  <View style={[styles.growthBadge, stats.todayGrowth > 0 ? styles.growthBadgeUp : styles.growthBadgeDown]}>
                    <Icon name={stats.todayGrowth > 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
                    <Text style={styles.growthText}>{Math.abs(stats.todayGrowth)}%</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            <Animated.View style={styles.metricCard}>
              <LinearGradient 
                colors={['#FFD93D', '#f5a623']} 
                style={styles.metricGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Icon name="date-range" size={28} color="#fff" />
                <Animated.Text style={styles.metricValueSmall}>
                  {countUpAnims.thisWeek}
                </Animated.Text>
                <Text style={styles.metricLabelSmall}>This Week</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={styles.metricCard}>
              <LinearGradient 
                colors={['#6C5CE7', '#5641d4']} 
                style={styles.metricGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Icon name="calendar-today" size={28} color="#fff" />
                <Animated.Text style={styles.metricValueSmall}>
                  {countUpAnims.thisMonth}
                </Animated.Text>
                <Text style={styles.metricLabelSmall}>This Month</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Daily Trend Chart */}
          <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.chartCardGradient}>
              <View style={styles.chartHeader}>
                <Icon name="trending-up" size={24} color="#32CD32" />
                <Text style={styles.chartTitle}>7-Day Trend</Text>
              </View>
              <LineChart
                data={{
                  labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Today'],
                  datasets: [{
                    data: stats.dailyTrend.length > 0 ? stats.dailyTrend : [0],
                  }],
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </LinearGradient>
          </Animated.View>

          {/* Crime Types Distribution */}
          <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.chartCardGradient}>
              <View style={styles.chartHeader}>
                <Icon name="pie-chart" size={24} color="#FFD93D" />
                <Text style={styles.chartTitle}>Crime Types Distribution</Text>
              </View>
              {stats.topCrimeTypes.length > 0 && (
                <PieChart
                  data={stats.topCrimeTypes.map(([type, count], index) => ({
                    name: type,
                    population: count,
                    color: ['#32CD32', '#FFD93D', '#FF6B6B', '#6C5CE7', '#00D9FF'][index],
                    legendFontColor: '#888',
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              )}
            </LinearGradient>
          </Animated.View>

          {/* Top Crime Types Bar */}
          <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.chartCardGradient}>
              <View style={styles.chartHeader}>
                <Icon name="bar-chart" size={24} color="#FF6B6B" />
                <Text style={styles.chartTitle}>Top Crime Categories</Text>
              </View>
              {stats.topCrimeTypes.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <BarChart
                    data={{
                      labels: stats.topCrimeTypes.map(([type]) => type.substring(0, 8)),
                      datasets: [{
                        data: stats.topCrimeTypes.map(([, count]) => count),
                      }],
                    }}
                    width={Math.max(screenWidth - 60, stats.topCrimeTypes.length * 80)}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                  />
                </ScrollView>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Hourly Crime Heatmap */}
          <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.chartCardGradient}>
              <View style={styles.chartHeader}>
                <Icon name="access-time" size={24} color="#FFD93D" />
                <Text style={styles.chartTitle}>24-Hour Crime Pattern</Text>
              </View>
              <View style={styles.heatmapContainer}>
                {stats.hourlyData.map((count, hour) => {
                  const maxCount = Math.max(...stats.hourlyData);
                  const intensity = maxCount > 0 ? count / maxCount : 0;
                  return (
                    <View key={hour} style={styles.heatmapItem}>
                      <View 
                        style={[
                          styles.heatmapBar, 
                          { 
                            height: `${intensity * 100}%`,
                            backgroundColor: `rgba(255, 215, 61, ${Math.max(0.2, intensity)})`,
                          }
                        ]} 
                      />
                      <Text style={styles.heatmapLabel}>
                        {hour === 0 ? '12AM' : hour < 12 ? `${hour}` : hour === 12 ? '12PM' : `${hour-12}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Crime Comparison Cards */}
          <Animated.View style={[styles.comparisonContainer, { opacity: fadeAnim }]}>
            <View style={styles.comparisonRow}>
              <TouchableOpacity style={styles.comparisonCard}>
                <LinearGradient 
                  colors={['rgba(50, 205, 50, 0.2)', 'rgba(50, 205, 50, 0.05)']} 
                  style={styles.comparisonGradient}
                >
                  <Icon name="trending-down" size={32} color="#32CD32" />
                  <Text style={styles.comparisonValue}>{stats.thisWeek}</Text>
                  <Text style={styles.comparisonLabel}>This Week</Text>
                  <View style={styles.comparisonBadge}>
                    <Icon name="calendar-today" size={14} color="#32CD32" />
                    <Text style={styles.comparisonBadgeText}>7 days</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.comparisonCard}>
                <LinearGradient 
                  colors={['rgba(108, 92, 231, 0.2)', 'rgba(108, 92, 231, 0.05)']} 
                  style={styles.comparisonGradient}
                >
                  <Icon name="trending-up" size={32} color="#6C5CE7" />
                  <Text style={styles.comparisonValue}>{stats.thisMonth}</Text>
                  <Text style={styles.comparisonLabel}>This Month</Text>
                  <View style={styles.comparisonBadge}>
                    <Icon name="event" size={14} color="#6C5CE7" />
                    <Text style={styles.comparisonBadgeText}>30 days</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Crime Type Breakdown with Progress Bars */}
          <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.listCardGradient}>
              <View style={styles.listHeader}>
                <Icon name="category" size={24} color="#00D9FF" />
                <Text style={styles.listTitle}>Crime Type Breakdown</Text>
              </View>
              {stats.topCrimeTypes.map(([type, count], index) => {
                const colors = ['#32CD32', '#FFD93D', '#FF6B6B', '#6C5CE7', '#00D9FF'];
                const percentage = ((count / stats.filtered) * 100).toFixed(1);
                return (
                  <View key={index} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <View style={styles.breakdownLeft}>
                        <View style={[styles.breakdownDot, { backgroundColor: colors[index] }]} />
                        <Text style={styles.breakdownType}>{type}</Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text style={styles.breakdownCount}>{count}</Text>
                        <Text style={styles.breakdownPercentage}>{percentage}%</Text>
                      </View>
                    </View>
                    <View style={styles.breakdownProgressContainer}>
                      <LinearGradient
                        colors={[colors[index], `${colors[index]}80`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.breakdownProgress, { width: `${percentage}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
            </LinearGradient>
          </Animated.View>

          {/* Hotspot Locations */}
          <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.listCardGradient}>
              <View style={styles.listHeader}>
                <Icon name="location-on" size={24} color="#FF6B6B" />
                <Text style={styles.listTitle}>Top Crime Hotspots</Text>
              </View>
              {stats.topLocations.map(([location, count], index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD93D' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle} numberOfLines={1}>{location}</Text>
                      <Text style={styles.listItemSubtext}>{count} incidents</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${(count / stats.topLocations[0][1]) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

          {/* Real-time Activity Feed */}
          <Animated.View style={[styles.activityCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.activityCardGradient}>
              <View style={styles.activityHeader}>
                <Icon name="notifications-active" size={24} color="#32CD32" />
                <Text style={styles.activityTitle}>Recent Activity</Text>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={styles.liveDotSmall} />
                </Animated.View>
              </View>
              {crimeData.slice(0, 5).map((crime, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon name="report-problem" size={20} color="#FF6B6B" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityType}>{crime.crime_type || 'Crime'}</Text>
                    <Text style={styles.activityLocation} numberOfLines={1}>{crime.location || 'Unknown location'}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(crime.date).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

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

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="analytics" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CrimeTrends')}>
            <Icon name="timeline" size={26} color="#888" />
            <Text style={styles.navText}>Trends</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    fontWeight: '600',
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
    marginBottom: 15,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  timeRangeContainer: {
    maxHeight: 60,
    marginBottom: 20,
  },
  timeRangeContent: {
    gap: 10,
    paddingVertical: 10,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    gap: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    borderColor: '#32CD32',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  metricCard: {
    width: '47%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  metricCardLarge: {
    width: '100%',
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  metricValueSmall: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '600',
  },
  metricLabelSmall: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  metricSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthBadgeUp: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  growthBadgeDown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  growthText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chart: {
    borderRadius: 16,
  },
  chartScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chartScrollContent: {
    paddingRight: 20,
  },
  listCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  listCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  listItem: {
    marginBottom: 15,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  listItemSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  activityCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activityCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  activityLocation: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
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
  heatmapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 5,
  },
  heatmapItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    marginHorizontal: 1,
  },
  heatmapBar: {
    width: '80%',
    backgroundColor: '#FFD93D',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  heatmapLabel: {
    fontSize: 8,
    color: '#888',
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },
  comparisonContainer: {
    marginBottom: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  comparisonCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  comparisonGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  comparisonValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  comparisonBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  breakdownItem: {
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownType: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownCount: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  breakdownPercentage: {
    fontSize: 14,
    color: '#32CD32',
    fontWeight: '700',
  },
  breakdownProgressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownProgress: {
    height: '100%',
    borderRadius: 4,
  },
});

export default AnalyticsDashboardScreen;
