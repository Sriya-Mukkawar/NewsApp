import * as SecureStore from "expo-secure-store";

export const setStoredCategories = async (email: string, categories: string[]) => {
  await SecureStore.setItemAsync(`user_summary_${email}`, JSON.stringify(categories));
};

export const getStoredCategories = async (email: string): Promise<string[] | null> => {
  const storedValue = await SecureStore.getItemAsync(`user_summary_${email}`);
  return storedValue ? JSON.parse(storedValue) : null;
};
