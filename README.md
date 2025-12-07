# 🚨 CrimeSpotter

**CrimeSpotter** is a comprehensive mobile application built with React Native and Expo that provides real-time crime monitoring, analytics, and community safety features. The app empowers users to stay informed about crime in their area, discover safe routes, and engage with their community.

## 📱 Screenshots

<div align="center">
  <img src="https://github.com/PRIYADHARSANK/Crime-Spotter/blob/main/screenshots/home.jpg" width="200" alt="Home Screen"/>
  <img src="https://github.com/PRIYADHARSANK/Crime-Spotter/blob/main/screenshots/2.jpg" width="200" alt="Crime Map"/>
  <img src="https://github.com/PRIYADHARSANK/Crime-Spotter/blob/main/screenshots/3.jpg" width="200" alt="Analytics"/>
  <img src="https://github.com/PRIYADHARSANK/Crime-Spotter/blob/main/screenshots/4.jpg" width="200" alt="Alerts"/>
  <img src="https://github.com/PRIYADHARSANK/Crime-Spotter/blob/main/screenshots/5.jpg" width="200" alt="Community"/>
</div>

## ✨ Features

### 🗺️ **Interactive Crime Map**
- Real-time visualization of crime incidents on an interactive map
- Color-coded markers based on crime severity
- Filter crimes by type, date range, and location
- Cluster view for high-density crime areas
- Detailed crime information on marker tap

### 📊 **Analytics Dashboard**
- Comprehensive crime statistics and trends
- Interactive charts and graphs using React Native Chart Kit
- Crime frequency analysis by type, time, and location
- Comparative analytics across different periods
- Visual insights into crime patterns

### 🚨 **Real-Time Crime Alerts**
- **Live Crime Monitoring**: Automatic checks every 10 seconds for new crimes
- **Location-Based Alerts**: Set your area and receive relevant notifications
- **Customizable Alert Radius**: Choose from 1km, 5km, 10km, or 20km
- **Crime Type Filters**: Select specific crime types to monitor
- **Push Notifications**: Instant alerts with crime details
- **Recent Alerts Feed**: View and track last 10 alerts with timestamps
- **Alert Statistics**: Monitor active filters and recent activity

### 🔮 **Crime Predictor**
- AI-powered crime prediction based on historical data
- Risk assessment for specific areas and times
- Preventive insights and recommendations
- Pattern recognition and forecasting

### 📈 **Crime Trends Analysis**
- Long-term trend visualization
- Seasonal pattern identification
- Hotspot analysis
- Comparative year-over-year statistics

### 🛣️ **Safe Route Finder**
- Calculate the safest route between two locations
- Avoid high-crime areas
- Real-time route optimization
- Turn-by-turn safe navigation

### 💬 **Community Forum**
- Connect with neighbors and local community
- Share safety tips and local crime awareness
- Report suspicious activities
- Community-driven crime prevention

### 📸 **Evidence Upload**
- Capture and upload photo/video evidence
- Secure storage with Firebase integration
- Attach evidence to specific incidents
- Privacy-focused evidence handling

### 👤 **User Profile & Authentication**
- Secure authentication powered by Clerk
- Personalized user profiles
- Customizable alert preferences
- Activity history and saved locations

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development framework and tooling
- **React Navigation** - Navigation and routing
- **React Native Maps** - Interactive map component
- **React Native Chart Kit** - Data visualization
- **React Native Paper** - Material Design components
- **React Native Vector Icons** - Icon library

### Backend & Services
- **Firebase** - Real-time database and storage
- **Clerk** - User authentication and management
- **Expo Notifications** - Push notification service
- **Expo Location** - Geolocation services

### Additional Libraries
- **expo-camera** - Camera access for evidence capture
- **expo-image-picker** - Media selection
- **expo-secure-store** - Secure local storage
- **react-native-gesture-handler** - Touch handling
- **react-native-reanimated** - Advanced animations

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/PRIYADHARSANK/Crime-Spotter.git
   cd Crime-Spotter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   ```

4. **Set up Firebase**
   
   Update `firebaseConfig.js` with your Firebase credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your device**
   - **Android**: Press `a` or run `npm run android`
   - **iOS**: Press `i` or run `npm run ios`
   - **Web**: Press `w` or run `npm run web`
   - **Scan QR code** with Expo Go app on your mobile device

## 📱 Running the App

### Development Mode
```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Production Build
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## 📁 Project Structure

```
CrimeSpotter/
├── assets/                     # Static assets (fonts, images)
│   ├── Poppins/               # Poppins font family
│   └── Roboto/                # Roboto font family
├── components/                 # Reusable components
│   ├── CrimeMap.js            # Interactive map component
│   └── CrimeTable.js          # Crime data table view
├── data/                       # Static data and mock data
│   └── crimeData.js           # Crime dataset
├── screens/                    # Application screens
│   ├── DashboardScreen.js     # Main dashboard
│   ├── SigninScreen.js        # Authentication screen
│   ├── ProfileScreen.js       # User profile
│   ├── AnalyticsScreen.js     # Analytics view
│   ├── AnalyticsDashboardScreen.js  # Detailed analytics
│   ├── CrimePredictorScreen.js      # Crime prediction
│   ├── CrimeTrendsScreen.js         # Trend analysis
│   ├── RealTimeCrimeAlertsScreen.js # Alert system
│   ├── SafeRouteScreen.js           # Safe route planning
│   ├── CommunityForumScreen.js      # Community features
│   ├── EvidenceUploadScreen.js      # Evidence submission
│   └── SplashScreen.js              # App splash screen
├── App.js                      # Main app component
├── clerk.js                    # Clerk configuration
├── firebaseConfig.js          # Firebase configuration
├── index.js                    # Entry point
├── metro.config.js            # Metro bundler config
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

## 🔑 Key Features Explained

### Real-Time Alerts System
The alert system monitors crime data continuously and sends push notifications based on user preferences:
- **Automatic Monitoring**: Polls API every 10 seconds
- **Smart Filtering**: Location-based and crime-type filtering
- **Efficient Notifications**: Only notifies for new, relevant crimes
- **User Control**: Full customization of alert preferences

See [REALTIME_ALERTS_README.md](./REALTIME_ALERTS_README.md) for detailed documentation.

### Crime Mapping
Interactive maps powered by React Native Maps display:
- Real-time crime locations with custom markers
- Heat maps for crime density
- Route planning with crime avoidance
- Location-based filtering

### Analytics & Insights
Comprehensive data visualization includes:
- Time-series charts showing crime trends
- Bar charts for crime type distribution
- Pie charts for category breakdown
- Statistical summaries and comparisons

## 🔒 Security & Privacy

- **Secure Authentication**: Clerk provides enterprise-grade authentication
- **Data Encryption**: All sensitive data is encrypted
- **Privacy Controls**: Users control what information they share
- **Secure Storage**: expo-secure-store for sensitive local data
- **Firebase Security Rules**: Backend access control

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **PRIYADHARSAN K** - [GitHub](https://github.com/PRIYADHARSANK)

## 🙏 Acknowledgments

- Crime data sources and APIs
- Open-source community for amazing libraries
- React Native and Expo teams for excellent frameworks
- Contributors and testers

## 📞 Support

For support, email dharsans2004@gmail.com or open an issue in the GitHub repository.

## 🚀 Future Enhancements

- [ ] Machine learning-based crime prediction
- [ ] Social sharing features
- [ ] Multi-language support
- [ ] Dark mode support
- [ ] Offline mode capability
- [ ] Integration with local law enforcement APIs
- [ ] AR features for crime visualization
- [ ] Wearable device support

---

**Made with ❤️ for safer communities**
