import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, Image, Alert, FlatList, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const EvidenceUploadScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [crimeType, setCrimeType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [userName, setUserName] = useState('User');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const crimeTypes = [
    { id: 'theft', label: 'Theft', icon: 'shopping-bag', color: '#FF6B6B' },
    { id: 'assault', label: 'Assault', icon: 'dangerous', color: '#e94560' },
    { id: 'burglary', label: 'Burglary', icon: 'home', color: '#FFD93D' },
    { id: 'vandalism', label: 'Vandalism', icon: 'broken-image', color: '#6C5CE7' },
    { id: 'robbery', label: 'Robbery', icon: 'money-off', color: '#FF6B6B' },
    { id: 'other', label: 'Other', icon: 'report', color: '#888' },
  ];

  useEffect(() => {
    if (user) {
      setUserName(user.firstName || user.username || 'User');
    }

    requestPermissions();

    // Listen to evidence reports from Firestore
    const q = query(collection(db, 'evidenceReports'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = [];
      snapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setReports(reportsData);
    });

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

    return () => unsubscribe();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant camera and media library permissions.');
    }
  };

  const pickMedia = async () => {
    if (selectedMedia.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 media files per report.');
      return;
    }

    Alert.alert(
      'Upload Evidence',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled) {
              setSelectedMedia([...selectedMedia, result.assets[0]]);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.7,
            });
            if (!result.canceled) {
              const newMedia = result.assets.slice(0, 5 - selectedMedia.length);
              setSelectedMedia([...selectedMedia, ...newMedia]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeMedia = (index) => {
    const updated = [...selectedMedia];
    updated.splice(index, 1);
    setSelectedMedia(updated);
  };

  const convertImageToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image:', error);
      throw error;
    }
  };

  const submitReport = async () => {
    if (!crimeType || !location || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (selectedMedia.length === 0) {
      Alert.alert('No Evidence', 'Please upload at least one photo as evidence.');
      return;
    }

    setUploading(true);

    try {
      // Convert all media files to base64
      const mediaBase64Array = [];
      for (let i = 0; i < selectedMedia.length; i++) {
        const base64 = await convertImageToBase64(selectedMedia[i].uri);
        mediaBase64Array.push(base64);
      }

      // Add report to Firestore
      await addDoc(collection(db, 'evidenceReports'), {
        user: userName,
        crimeType,
        location,
        description,
        mediaURLs: mediaBase64Array,
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      Alert.alert('Success', 'Evidence report submitted successfully!', [
        { text: 'OK', onPress: () => {
          setCrimeType('');
          setLocation('');
          setDescription('');
          setSelectedMedia([]);
        }}
      ]);

      setUploading(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setUploading(false);
    }
  };

  const getCrimeTypeColor = (type) => {
    const crimeTypeData = crimeTypes.find(ct => ct.id === type);
    return crimeTypeData ? crimeTypeData.color : '#888';
  };

  const getCrimeTypeIcon = (type) => {
    const crimeTypeData = crimeTypes.find(ct => ct.id === type);
    return crimeTypeData ? crimeTypeData.icon : 'report';
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
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
            <Text style={styles.headerTitle}>Evidence Upload</Text>
            <TouchableOpacity style={styles.helpButton}>
              <Icon name="help-outline" size={24} color="#32CD32" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Report crime with photo/video evidence</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Report Form */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.formGradient}>
              <Text style={styles.sectionTitle}>Crime Details</Text>

              {/* Crime Type Selection */}
              <Text style={styles.fieldLabel}>Crime Type *</Text>
              <View style={styles.crimeTypesGrid}>
                {crimeTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setCrimeType(type.id)}
                    style={[
                      styles.crimeTypeButton,
                      crimeType === type.id && { 
                        backgroundColor: `${type.color}20`,
                        borderColor: type.color
                      }
                    ]}
                  >
                    <Icon 
                      name={type.icon} 
                      size={24} 
                      color={crimeType === type.id ? type.color : '#888'} 
                    />
                    <Text 
                      style={[
                        styles.crimeTypeText,
                        crimeType === type.id && { color: type.color }
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location */}
              <Text style={styles.fieldLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crime location"
                placeholderTextColor="#666"
                value={location}
                onChangeText={setLocation}
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what happened..."
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>

              {/* Media Upload */}
              <Text style={styles.fieldLabel}>Evidence (Photos/Videos) *</Text>
              <Text style={styles.fieldHint}>Upload up to 5 media files</Text>

              {selectedMedia.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGrid}>
                  {selectedMedia.map((media, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <TouchableOpacity onPress={() => {
                        setSelectedImage(media.uri);
                        setShowImageModal(true);
                      }}>
                        <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeMedia(index)}
                      >
                        <Icon name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
                <Icon name="add-a-photo" size={24} color="#32CD32" />
                <Text style={styles.uploadButtonText}>
                  {selectedMedia.length > 0 ? 'Add More Media' : 'Upload Evidence'}
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitReport}
                disabled={uploading}
              >
                <LinearGradient colors={['#32CD32', '#28a428']} style={styles.submitButtonGradient}>
                  {uploading ? (
                    <>
                      <Icon name="hourglass-empty" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Submit Report</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Recent Reports */}
          <Animated.View style={[styles.reportsSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Recent Evidence Reports</Text>
            {reports.slice(0, 5).map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.reportGradient}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportIconContainer}>
                      <Icon 
                        name={getCrimeTypeIcon(report.crimeType)} 
                        size={24} 
                        color={getCrimeTypeColor(report.crimeType)} 
                      />
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportUser}>{report.user}</Text>
                      <Text style={styles.reportTime}>{getTimeAgo(report.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 217, 61, 0.2)' }]}>
                      <Text style={[styles.statusText, { color: '#FFD93D' }]}>Pending</Text>
                    </View>
                  </View>
                  <Text style={styles.reportLocation}>
                    <Icon name="location-on" size={14} color="#888" /> {report.location}
                  </Text>
                  <Text style={styles.reportDescription}>{report.description}</Text>
                  {report.mediaURLs && report.mediaURLs.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportMediaGrid}>
                      {report.mediaURLs.map((url, index) => (
                        <Image key={index} source={{ uri: url }} style={styles.reportMediaImage} />
                      ))}
                    </ScrollView>
                  )}
                </LinearGradient>
              </View>
            ))}
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

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={() => navigation.navigate('EvidenceUpload')}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="add-a-photo" size={32} color="#fff" />
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

        {/* Image Preview Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1}
              onPress={() => setShowImageModal(false)}
            >
              <LinearGradient colors={['#000000EE', '#000000CC']} style={styles.modalGradient}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowImageModal(false)}
                  >
                    <Icon name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalImageContainer}>
                  {selectedImage && (
                    <Image 
                      source={{ uri: selectedImage }} 
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
                
                <View style={styles.modalFooter}>
                  <Text style={styles.modalHint}>Tap anywhere to close</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>
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
  helpButton: {
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
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  formGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    marginTop: 15,
  },
  fieldHint: {
    fontSize: 12,
    color: '#888',
    marginTop: -8,
    marginBottom: 12,
  },
  crimeTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  crimeTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    gap: 8,
  },
  crimeTypeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: -5,
    marginBottom: 10,
  },
  mediaGrid: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 10,
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(50, 205, 50, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 15,
    paddingVertical: 20,
    gap: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#32CD32',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportsSection: {
    marginBottom: 20,
  },
  reportCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  reportGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 15,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportUser: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  reportTime: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMediaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  reportMediaImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#0a0a0a',
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
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  modalCloseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.7,
  },
  modalFooter: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  modalHint: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default EvidenceUploadScreen;
