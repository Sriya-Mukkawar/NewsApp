import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./context/ThemeContext";

interface UserCredentials {
  email: string;
  password: string;
}

export default function SignupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
  });

  const validatePassword = (password: string) => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      // Get existing users or initialize empty array
      const existingUsersJson = await AsyncStorage.getItem("userCredentials");
      let existingUsers: UserCredentials[] = [];
      
      if (existingUsersJson) {
        try {
          const parsed = JSON.parse(existingUsersJson);
          existingUsers = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error("Error parsing user credentials:", parseError);
          existingUsers = [];
        }
      }

      // Check if user already exists
      if (existingUsers.some(user => user.email === email)) {
        Alert.alert("Error", "User already exists");
        return;
      }

      // Add new user
      const newUser = { email, password };
      existingUsers.push(newUser);
      await AsyncStorage.setItem("userCredentials", JSON.stringify(existingUsers));

      // Store user data
      const userData = {
        name,
        email,
        newsPreference: "general",
      };
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify(userData));

      // Navigate to user form
      router.push({
        pathname: "/UserForm",
        params: { email },
      });
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert("Error", "Failed to sign up. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/bg2.png")} // Make sure the path is correct
      style={styles.background}
    >
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Register</Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor={colors.text}
          value={name}
          onChangeText={setName}
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
        />
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
          onChangeText={(text) => {
            setPassword(text);
            validatePassword(text);
          }}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.text}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <View style={styles.validationContainer}>
          {Object.entries(validation).map(([key, valid]) => (
            <Text key={key} style={{ color: valid ? colors.success : colors.secondary, fontSize: 12 }}>
              {valid ? "✔" : "✖"} {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleSignup}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.secondary }]} 
            onPress={() => router.push("../login")}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Go to Login</Text>
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
  validationContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
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
