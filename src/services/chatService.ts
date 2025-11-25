import axios from "axios";
import { Platform } from "react-native";
import { API_URL } from "../constants/config";

export const sendTextMessage = async (message: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/chat`,
      { message },
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
    return response.data.reply;
  } catch (error) {
    throw error;
  }
};

export const uploadVoiceMessage = async (uri: string) => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], "recording.m4a", { type: "audio/m4a" });
    formData.append('file', file);
  } else {
    formData.append('file', {
      uri: uri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as any);
  }

  const response = await fetch(`${API_URL}/voice`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server Error: ${text}`);
  }

  return await response.json();
};