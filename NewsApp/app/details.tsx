import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Linking,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setStoredCategories, getStoredCategories } from "../utils/storage"
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "./context/ThemeContext";

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
}

interface UserPreference {
  newsPreference: string;
}

const NewsScreen = () => {
  const { colors, toggleTheme } = useTheme();
  const router = useRouter();
  const { email, initialCategory } = useLocalSearchParams<{ email: string; initialCategory?: string }>();
  const [headlines, setHeadlines] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<string>("general");
  const [country, setCountry] = useState("us");
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const [selectedHeadline, setSelectedHeadline] = useState<Article | null>(null);
  const [showSummarizationOptions, setShowSummarizationOptions] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");

  const API_KEYS = [
    "3cca4c239c584c3991a5ed6b04702e49",
    "33a9607aa32e4a06a333529073387c69",
    "eed1f00dff514965845ee87d1b9456e3",
    "b4878dbaeae8316ff2df2ef5cdbe70a8",
  ];

  // Set initial category when component mounts
  useEffect(() => {
    if (initialCategory && typeof initialCategory === 'string') {
      console.log("📝 Setting initial category from params:", initialCategory);
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const loadUserPreference = async () => {
      console.log("🔍 Starting loadUserPreference with email:", email);
      
      if (!email) {
        console.log("⚠️ No email found in params, skipping preference load");
        return;
      }

      // Only load preferences if we don't have an initial category
      if (!initialCategory) {
        try {
          console.log("🔍 Loading preferences for email:", email);
          
          // First try to get the last summarized category
          const response = await fetch(`http://192.168.122.44:5001/api/last-category/${email}`);
          const data = await response.json();
          
          if (response.ok && data.category) {
            console.log("✅ Last summarized category from server:", data.category);
            setCategory(data.category);
            return;
          }

          // If no summarized category (404) or error, try to get user preference
          const userData = await AsyncStorage.getItem(`user_${email}`);
          if (userData) {
            const { newsPreference } = JSON.parse(userData);
            console.log("📝 Setting category to user preference:", newsPreference);
            setCategory(newsPreference);
          } else {
            console.log("ℹ️ No user preference found in AsyncStorage");
          }
        } catch (error) {
          console.log("⚠️ Error loading user preference:", error);
          // Try to get user preference as fallback
          const userData = await AsyncStorage.getItem(`user_${email}`);
          if (userData) {
            const { newsPreference } = JSON.parse(userData);
            console.log("📝 Setting category to user preference (fallback):", newsPreference);
            setCategory(newsPreference);
          } else {
            console.log("ℹ️ No user preference found in AsyncStorage (fallback)");
          }
        }
      } else {
        console.log("ℹ️ Initial category provided, skipping preference load");
      }
    };
  
    loadUserPreference();
  }, [email, initialCategory]);

  // Load user name when component mounts
  useEffect(() => {
    const loadUserName = async () => {
      if (email) {
        try {
          const userData = await AsyncStorage.getItem(`user_${email}`);
          if (userData) {
            const { name } = JSON.parse(userData);
            setUserName(name);
          }
        } catch (error) {
          console.log("Error loading user name:", error);
        }
      }
    };
    loadUserName();
  }, [email]);

  const storeSummarizedCategory = async (category: string) => {
    if (!email) {
      console.error("❌ No email found for storing category");
      return;
    }

    try {
      const response = await fetch("http://192.168.122.44:5001/api/store-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category }),
      });

      const data = await response.json();
      console.log("✅ Stored summarized category:", data);

      if (!data.success) {
        console.error("❌ Failed to store category:", data.message);
      }
    } catch (error) {
      console.error("❌ Error storing summarized category:", error);
    }
  };

  // Fetch news when category or country changes
  useEffect(() => {
    fetchHeadlines();
  }, [category, country]);

  const fetchHeadlines = async (index = 0) => {
    if (index >= API_KEYS.length) {
      console.error("All API keys failed.");
      Alert.alert("Error", "Failed to fetch news. Please try again later.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${API_KEYS[index]}`;
      const response = await axios.get(NEWS_API_URL);

      if (response.data.articles.length === 0) {
        Alert.alert("No News Found", "No headlines available for this category.");
      }

      setHeadlines(response.data.articles.map((article: Article) => ({ ...article, category })));
    } catch (error) {
      console.error(`API Key ${API_KEYS[index]} failed, trying next key...`, error);
      fetchHeadlines(index + 1);
    } finally {
      setLoading(false);
    }
  };
  
  
  

  // When a user selects a headline
  const handleHeadlinePress = (headline: Article) => {
    setSelectedHeadline(headline);
    setShowSummarizationOptions(true);
  };

  // Summarization logic
  const handleSummarize = async (model: string) => {
    if (!selectedHeadline) return;

    try {
      setLoading(true);
      console.log("Sending article for summarization:", selectedHeadline.description || selectedHeadline.title);
      
      const response = await axios.post("http://192.168.122.44:5002/summarize", {
        text: selectedHeadline.description || selectedHeadline.title,
        model: model
      });

      console.log("Received summary response:", response.data);

      if (response.data && response.data.summary) {
        // Create a summary with timing information
        const timingInfo = `Time taken by ${response.data.model}: ${response.data.time_taken.toFixed(2)} seconds\n\n`;
        setSummary(timingInfo + response.data.summary);
        setShowSummaryModal(true);
        setShowSummarizationOptions(false);

        // Store the summarized category
        if (category) {
          await storeSummarizedCategory(category);
        }
      } else {
        throw new Error("No summary received from the server");
      }
    } catch (error) {
      console.error("Error summarizing news:", error);
      Alert.alert("Error", "Failed to summarize news. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullNews = () => {
    if (selectedHeadline) {
      Linking.openURL(selectedHeadline.url);
    }
  };
  
  

  const handleLogout = async () => {
    setShowMenu(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      // Only clear the logged in user state
      await AsyncStorage.removeItem("loggedInUser");
      console.log("Cleared logged in user");
      
      // Navigate to login
      router.replace("../login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>News App</Text>
        <Pressable onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons 
            name={colors.background === '#FFFFFF' ? 'moon' : 'sunny'} 
            size={24} 
            color={colors.text} 
          />
        </Pressable>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={[styles.menuOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContent, { backgroundColor: colors.card }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Hi, {userName}</Text>
              <Pressable onPress={() => setShowMenu(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <Pressable style={[styles.menuOverlay, { backgroundColor: colors.overlay }]} onPress={cancelLogout}>
          <View style={[styles.confirmContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Are you sure you want to logout?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={[styles.confirmButton, styles.noButton]} onPress={cancelLogout}>
                <Text style={styles.confirmButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, styles.yesButton]} onPress={confirmLogout}>
                <Text style={styles.confirmButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* News Category Selector */}
      <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.pickerLabel, { color: colors.text }]}>Select Category:</Text>
        <View style={[styles.pickerWrapper, { backgroundColor: colors.card }]}>
          <Picker
            selectedValue={category}
            onValueChange={async (itemValue) => {
              setCategory(itemValue);
              if (email) {
                const userData = await AsyncStorage.getItem(`user_${email}`);
                if (userData) {
                  const updatedUser = { ...JSON.parse(userData), newsPreference: itemValue };
                  await AsyncStorage.setItem(`user_${email}`, JSON.stringify(updatedUser));
                }
              }
            }}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
            itemStyle={{ color: '#000000', backgroundColor: colors.card }}
            mode="dropdown"
            dropdownIconRippleColor={colors.text}
            selectionColor={colors.primary}
          >
            <Picker.Item label="General" value="general" color="#000000" />
            <Picker.Item label="Business" value="business" color="#000000" />
            <Picker.Item label="Entertainment" value="entertainment" color="#000000" />
            <Picker.Item label="Health" value="health" color="#000000" />
            <Picker.Item label="Science" value="science" color="#000000" />
            <Picker.Item label="Sports" value="sports" color="#000000" />
            <Picker.Item label="Technology" value="technology" color="#000000" />
          </Picker>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading ? <ActivityIndicator size="large" color="blue" /> : null}

      {/* News List */}
      <FlatList
        data={headlines}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }: { item: Article }) => (
          <TouchableOpacity 
            style={[styles.newsItem, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]} 
            onPress={() => handleHeadlinePress(item)}
          >
            <Image source={{ uri: item.urlToImage }} style={styles.image} />
            <View style={styles.newsText}>
              <Text style={[styles.newsTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Summarization Options Modal */}
      <Modal visible={showSummarizationOptions} transparent={true} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Summarization Model</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.summaryButton, { backgroundColor: colors.primary }]} 
                onPress={() => handleSummarize("bart")}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Summarize with BART</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.summaryButton, { backgroundColor: colors.primary }]} 
                onPress={() => handleSummarize("t5")}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Summarize with T5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowSummarizationOptions(false)}
              >
                <Text style={{ color: colors.error }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal visible={showSummaryModal} transparent={true} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>News Summary</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowSummaryModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.summaryScroll}>
              <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
            </ScrollView>
            {selectedHeadline && (
              <TouchableOpacity 
                style={[styles.fullNewsButton, { backgroundColor: colors.primary }]}
                onPress={handleViewFullNews}
              >
                <Text style={[styles.fullNewsButtonText, { color: colors.background }]}>View Full News</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    padding: 8,
  },
  themeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
    width: "100%",
  },
  newsItem: {
    flexDirection: "row",
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  newsText: {
    flex: 1,
    marginLeft: 10,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  newsDescription: {
    fontSize: 14,
    color: "gray",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryScroll: {
    maxHeight: '80%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)',
  },
  menuContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#ff4444',
  },
  noButton: {
    backgroundColor: '#666',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
  },
  summaryButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 0,
  },
  cancelButton: {
    marginTop: 5,
    padding: 10,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  fullNewsButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  fullNewsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
