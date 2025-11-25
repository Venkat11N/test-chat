import { useState, useRef } from "react";
import { Audio } from "expo-av";
import { Alert, Platform, PermissionsAndroid } from "react-native";


export const useAudioRecorder = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "This app needs microphone access to record voice messages",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    } else {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Microphone permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRec);
      setTimer(0);

      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

    } catch (e) {
      console.error("Recording error:", e);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recording) return null;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecording(null);
      setTimer(0);
      return uri;

    } catch (e) {
      console.error("Stop error:", e);
      setRecording(null);
      setTimer(0);
      return null;
    }
  };

  return { recording, timer, startRecording, stopRecording };
};