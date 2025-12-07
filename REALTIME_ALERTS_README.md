# Real-Time Crime Alerts - Feature Documentation

## 🚨 Overview
The Real-Time Crime Alerts feature provides instant push notifications when crimes occur in your specified area. This feature monitors crime data every 10 seconds and sends notifications based on your preferences.

## ✨ Key Features

### 1. **Live Crime Monitoring**
- Checks for new crimes every 10 seconds
- Real-time updates with live indicator
- Automatic background monitoring when enabled

### 2. **Location-Based Alerts**
- Set your location (e.g., "Downtown", "Brooklyn")
- Configurable alert radius: 1km, 5km, 10km, or 20km
- Only receive alerts for crimes in your area

### 3. **Crime Type Filters**
- Choose which crime types to monitor:
  - Theft
  - Assault
  - Burglary
  - Robbery
  - Vandalism
  - Drug-related
  - Vehicle Theft
  - Fraud
  - Cyber Crime
  - Other
- Toggle filters on/off with visual indicators

### 4. **Push Notifications**
- Instant notification when crime occurs
- Shows crime type and location
- High-priority Android notifications
- iOS notification support

### 5. **Recent Alerts Feed**
- View last 10 alerts received
- Time stamps (e.g., "5m ago")
- Crime details and locations
- Color-coded by crime severity

### 6. **Alert Statistics**
- Track number of recent alerts
- Monitor active filters count
- View current monitoring radius

## 🎨 UI Components

### Master Toggle Card
- Large prominent card at top
- Green when enabled, gray when disabled
- Shows monitoring status
- Last checked timestamp

### Location Settings
- Location input field
- Radius selector buttons (1km - 20km)
- Visual feedback for selection

### Filter Chips
- Grid layout of crime types
- Color-coded by category
- Checkmark when selected
- Touch to toggle

### Statistics Cards
- 3 metric cards showing:
  - Recent alerts count
  - Active filters
  - Alert radius

### Alert Feed
- Scrollable list of recent alerts
- Icon-based crime type indicators
- Location pins
- Relative timestamps
- Empty state when no alerts

## 🔧 Technical Implementation

### Notification System
- Uses `expo-notifications` package
- Requests permissions on first load
- Configures notification handler for foreground/background
- High priority for Android
- Sound and badge enabled

### Data Fetching
- Polls crime API every 10 seconds
- Compares with previous data to detect new crimes
- Filters based on user preferences
- Efficient state management

### Performance Optimizations
- Only updates when alerts enabled
- Efficient data comparison (length check)
- Limits recent alerts to 10 items
- Smooth animations with useRef

## 📱 Usage Guide

### Setup Steps:
1. **Enable Alerts**: Toggle the master switch ON
2. **Set Location**: Enter your location or area name
3. **Choose Radius**: Select how far from your location (1-20km)
4. **Select Crime Types**: Tap crime type chips to enable/disable
5. **Test Notification**: Use "Send Test Alert" button to verify

### Receiving Alerts:
- Notifications appear automatically when criteria match
- Check Recent Alerts section for history
- Tap alerts for more details (future enhancement)

### Best Practices:
- Enable only relevant crime types to reduce noise
- Set appropriate radius based on area size
- Check last updated time to ensure monitoring is active
- Test notifications after setup

## 🎯 Notification Format

**Title**: `⚠️ Crime Alert: [Crime Type]`
**Body**: `[Location] - [Description]`

Example:
```
⚠️ Crime Alert: Theft
Downtown Area - Bicycle stolen from parking lot
```

## 🔐 Permissions Required

### Android:
- `POST_NOTIFICATIONS` (Android 13+)
- Automatically requested on app launch

### iOS:
- Notification permission
- Requested via system dialog

## 🚀 Future Enhancements (Roadmap)

1. **Push to Device** - Background notifications even when app closed
2. **Geofencing** - More accurate location-based alerts
3. **Priority Levels** - High/Medium/Low alert severity
4. **Quiet Hours** - Schedule when to receive alerts
5. **Multiple Locations** - Monitor several areas simultaneously
6. **Alert History** - Full searchable alert database
7. **Crime Patterns** - AI predictions for high-risk times
8. **Social Sharing** - Share alerts with community
9. **Emergency Contacts** - Auto-notify contacts for severe crimes
10. **Widget Support** - Home screen alert widget

## 🐛 Troubleshooting

### Notifications Not Working:
1. Check master toggle is ON
2. Verify notification permissions granted
3. Use "Send Test Alert" button
4. Check device notification settings
5. Ensure app is running (background support coming)

### No Alerts Appearing:
1. Verify location and radius settings
2. Check crime type filters are enabled
3. Look at "Last checked" timestamp
4. Ensure internet connection active
5. Try broader location search

### Performance Issues:
1. Reduce number of active filters
2. Increase check interval (future feature)
3. Clear recent alerts (auto-limited to 10)
4. Close and restart app

## 📊 Statistics & Metrics

The screen tracks:
- Total alerts received (session)
- Active crime type filters
- Current monitoring radius
- Last data check time
- Real-time monitoring status

## 🎨 Color Coding

Crime types use consistent colors:
- **Red (#FF6B6B)**: High severity (Assault, Robbery, Burglary, Fraud)
- **Yellow (#FFD93D)**: Medium severity (Theft, Vandalism, Vehicle Theft)
- **Purple (#6C5CE7)**: Special category (Drug-related)
- **Cyan (#00D9FF)**: Tech crimes (Cyber Crime)
- **Gray (#888)**: Disabled/Other

## 🔄 Data Flow

1. User enables alerts
2. Background timer starts (10s interval)
3. Fetch crime data from API
4. Compare with previous data
5. Filter by location, radius, type
6. Send notifications for matches
7. Add to recent alerts feed
8. Update statistics
9. Repeat

## 💡 Tips & Tricks

- **Urban Areas**: Use smaller radius (1-5km)
- **Suburban**: Use medium radius (5-10km)
- **Rural**: Use larger radius (10-20km)
- **Commute**: Set location to work/school area
- **Travel**: Update location when visiting new places
- **Test First**: Always send test alert after configuration
- **Filter Wisely**: Enable only crimes you want to know about

## 🏗️ Architecture

### Components:
- RealTimeCrimeAlertsScreen (Main component)
- expo-notifications (Notification system)
- React Native Animated (Smooth animations)
- LinearGradient (Visual design)
- MaterialIcons (Icon library)

### State Management:
- useState for user preferences
- useRef for animations
- useEffect for data fetching
- Real-time interval updates

### API Integration:
- Crime data: `https://api-2-2-88x4.onrender.com/crimes`
- Polling: 10-second intervals
- Error handling for network issues

## 📈 Analytics Integration Ready

The feature is designed to track:
- Alert click-through rates
- Most used filters
- Average radius settings
- Notification response times
- User engagement metrics

(Analytics integration coming soon)

---

**Version**: 1.0.0  
**Last Updated**: November 1, 2025  
**Status**: ✅ Production Ready  
**Platform**: iOS & Android (React Native + Expo)
