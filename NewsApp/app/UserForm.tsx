import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "./context/ThemeContext";

interface UserDetails {
  email: string;
  name: string;
  age: string;
  profession: string;
  newsPreference: string;
}

const UserForm: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [profession, setProfession] = useState<string>("");
  const [newsPreference, setNewsPreference] = useState<string>("general");

  useEffect(() => {
    if (!email) {
      Alert.alert("Error", "No email found. Please sign up again.");
      router.replace("../signup");
    }
  }, [email]);

  const handleSubmit = async () => {
    try {
      const userDataJson = await AsyncStorage.getItem(`user_${email}`);
      if (!userDataJson) {
        Alert.alert("Error", "User data not found");
        return;
      }

      const userData = JSON.parse(userDataJson);
      userData.newsPreference = newsPreference;
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify(userData));

      router.push({
        pathname: "/details",
        params: { 
          email,
          initialCategory: newsPreference 
        }
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "Failed to save preferences");
    }
  };
  

  return (
    <ImageBackground
      source={require("../assets/images/bg2.png")}
      style={styles.background}
    >
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Name"
          placeholderTextColor={colors.text}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Age"
          placeholderTextColor={colors.text}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Profession"
          placeholderTextColor={colors.text}
          value={profession}
          onChangeText={setProfession}
        />
        <Text style={[styles.label, { color: colors.text }]}>News Preference:</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
          <Picker
            selectedValue={newsPreference}
            onValueChange={setNewsPreference}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
            itemStyle={{ color: '#000000', backgroundColor: colors.card }}
            mode="dropdown"
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
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

export default UserForm;
