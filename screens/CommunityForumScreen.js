import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, FlatList, KeyboardAvoidingView, Platform, Image, Alert, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';

const CommunityForumScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('General');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('User');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [commentingOnMessage, setCommentingOnMessage] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const tabs = [
    { id: 'General', icon: 'forum', color: '#32CD32' },
    { id: 'Safety Tips', icon: 'shield', color: '#FFD93D' },
    { id: 'Alerts', icon: 'warning', color: '#FF6B6B' },
    { id: 'Questions', icon: 'help', color: '#6C5CE7' },
  ];

  useEffect(() => {
    if (user) {
      setUserName(user.firstName || user.username || 'User');
    }

    // Request permissions
    requestPermissions();

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
  }, []);

  useEffect(() => {
    // Listen to messages from Firestore
    const q = query(collection(db, 'communityMessages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setMessages(messagesData);
    }, (error) => {
      console.error('Error fetching messages:', error);
    });

    return () => unsubscribe();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant camera and media library permissions to upload images.');
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Upload Media',
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
              setSelectedMedia(result.assets[0]);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled) {
              setSelectedMedia(result.assets[0]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  const sendMessage = async () => {
    if (newMessage.trim() === '' && !selectedMedia) return;

    setUploading(true);

    try {
      let mediaBase64 = null;
      if (selectedMedia) {
        mediaBase64 = await convertImageToBase64(selectedMedia.uri);
      }

      await addDoc(collection(db, 'communityMessages'), {
        user: userName,
        avatar: userName.charAt(0).toUpperCase(),
        message: newMessage,
        tab: activeTab,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: [],
        mediaURL: mediaBase64,
      });

      setNewMessage('');
      setSelectedMedia(null);
      setUploading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setUploading(false);
    }
  };

  const toggleLike = async (messageId, currentLikes, likedBy = []) => {
    try {
      const userIdentifier = user?.id || userName;
      const hasLiked = likedBy.includes(userIdentifier);
      
      const messageRef = doc(db, 'communityMessages', messageId);
      
      if (hasLiked) {
        // Unlike
        await updateDoc(messageRef, {
          likes: currentLikes - 1,
          likedBy: likedBy.filter(id => id !== userIdentifier),
        });
      } else {
        // Like
        await updateDoc(messageRef, {
          likes: currentLikes + 1,
          likedBy: arrayUnion(userIdentifier),
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (messageId) => {
    if (commentText.trim() === '') return;

    try {
      const messageRef = doc(db, 'communityMessages', messageId);
      
      await updateDoc(messageRef, {
        comments: arrayUnion({
          id: Date.now().toString(),
          user: userName,
          text: commentText,
          timestamp: new Date().toISOString(),
        }),
      });

      setCommentText('');
      setCommentingOnMessage(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const toggleComments = (messageId) => {
    setExpandedComments(prev => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const filteredMessages = messages.filter(msg => msg.tab === activeTab);

  const getCategoryColor = (tab) => {
    const tabData = tabs.find(t => t.id === tab);
    return tabData ? tabData.color : '#32CD32';
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

  const renderMessage = ({ item }) => {
    const userIdentifier = user?.id || userName;
    const hasLiked = item.likedBy?.includes(userIdentifier);
    const commentsExpanded = expandedComments[item.id];

    return (
    <Animated.View style={[styles.messageCard, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.messageGradient}>
        <View style={styles.messageHeader}>
          <View style={styles.userInfo}>
            <LinearGradient 
              colors={['#32CD32', '#28a428']} 
              style={styles.userAvatar}
            >
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </LinearGradient>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user}</Text>
              <Text style={styles.timestamp}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(item.tab)}20` }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.tab) }]}>
              {item.tab}
            </Text>
          </View>
        </View>

        <Text style={styles.messageText}>{item.message}</Text>

        {item.mediaURL && (
          <TouchableOpacity onPress={() => {
            setSelectedImage(item.mediaURL);
            setShowImageModal(true);
          }}>
            <Image source={{ uri: item.mediaURL }} style={styles.messageImage} />
          </TouchableOpacity>
        )}

        <View style={styles.messageActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => toggleLike(item.id, item.likes || 0, item.likedBy || [])}
          >
            <Icon 
              name={hasLiked ? 'favorite' : 'favorite-border'} 
              size={18} 
              color={hasLiked ? '#e94560' : '#888'} 
            />
            <Text style={[styles.actionText, hasLiked && { color: '#e94560' }]}>
              {item.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleComments(item.id)}
          >
            <Icon name="chat-bubble-outline" size={18} color="#888" />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setCommentingOnMessage(item.id)}
          >
            <Icon name="add-comment" size={18} color="#32CD32" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {commentsExpanded && item.comments && item.comments.length > 0 && (
          <View style={styles.commentsSection}>
            {item.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {comment.user.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUser}>{comment.user}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Comment Input */}
        {commentingOnMessage === item.id && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#666"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={styles.commentSendButton}
              onPress={() => addComment(item.id)}
            >
              <Icon name="send" size={18} color="#32CD32" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
    );
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
            <Text style={styles.headerTitle}>Community Forum</Text>
            <TouchableOpacity style={styles.searchButton}>
              <Icon name="search" size={24} color="#32CD32" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Connect with your community</Text>
        </Animated.View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && { backgroundColor: `${tab.color}20` }
              ]}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? tab.color : '#888'} 
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === tab.id && { color: tab.color, fontWeight: 'bold' }
                ]}
              >
                {tab.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages List */}
        <FlatList
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="forum" size={64} color="#32CD32" style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>No messages in this category yet</Text>
              <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
            </View>
          )}
        />

        {/* Message Input */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <LinearGradient 
            colors={['rgba(10, 10, 10, 0.98)', 'rgba(0, 0, 0, 0.98)']} 
            style={styles.inputContainer}
          >
            {selectedMedia && (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeMediaButton}
                  onPress={() => setSelectedMedia(null)}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickImage}
              >
                <Icon name="photo-camera" size={24} color="#32CD32" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder={`Share in ${activeTab}...`}
                placeholderTextColor="#666"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={uploading}
              >
                <LinearGradient colors={['#32CD32', '#28a428']} style={styles.sendButtonGradient}>
                  {uploading ? (
                    <Icon name="hourglass-empty" size={20} color="#fff" />
                  ) : (
                    <Icon name="send" size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.charCount}>{newMessage.length}/500</Text>
          </LinearGradient>
        </KeyboardAvoidingView>

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

          <TouchableOpacity style={[styles.navItem, { marginTop: -30 }]} onPress={() => navigation.navigate('CommunityForum')}>
            <LinearGradient colors={['#32CD32', '#28a428']} style={styles.fabButton}>
              <Icon name="forum" size={32} color="#fff" />
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
  searchButton: {
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
  tabsContainer: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 10,
  },
  tab: {
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
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 180,
  },
  messageCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  messageGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
    borderRadius: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.1)',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#32CD32',
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.1)',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  commentSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 205, 50, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(50, 205, 50, 0.2)',
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  mediaButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 205, 50, 0.1)',
    borderRadius: 22,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)',
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
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

export default CommunityForumScreen;
