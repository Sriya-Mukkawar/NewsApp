import { useState } from "react";
import { View, Text, TextInput, Button, Alert, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./context/ThemeContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Get user credentials
      const userCredentialsJson = await AsyncStorage.getItem("userCredentials");
      if (!userCredentialsJson) {
        Alert.alert("Error", "No users found. Please sign up.");
        return;
      }

      const userCredentials = JSON.parse(userCredentialsJson);
      const user = userCredentials.find((u: { email: string; password: string }) => 
        u.email === email && u.password === password
      );

      if (!user) {
        Alert.alert("Error", "Invalid email or password");
        return;
      }

      // Get user data
      const userDataJson = await AsyncStorage.getItem(`user_${email}`);
      if (!userDataJson) {
        Alert.alert("Error", "User data not found");
        return;
      }

      const userData = JSON.parse(userDataJson);
      
      // Navigate to details with the user's preferred category
      router.push({
        pathname: "/details",
        params: { 
          email,
          initialCategory: userData.newsPreference || "general"
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Error", "Failed to log in. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/bg2.png")}
      style={styles.background}
    >
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Login</Text>
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Email"
            placeholderTextColor={colors.text}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Password"
            placeholderTextColor={colors.text}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleLogin}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.secondary }]} 
            onPress={() => router.push("../signup")}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 10,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  form: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
