import { useState, useRef } from "react";
import {
  View, TextInput, Text, TouchableOpacity, FlatList,
  StyleSheet, Platform, PermissionsAndroid, Alert, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import axios from "axios";

const API_URL = "https://curly-spiders-fold.loca.lt";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot" | "typing";
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      text: input, 
      sender: "user" 
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    scrollToBottom();

    const typingId = `typing-${Date.now()}`;
    setMessages(prev => [...prev, { 
      id: typingId, 
      text: "...", 
      sender: "typing" 
    }]);

    try {
      const response = await axios.post(`${API_URL}/chat`, { 
        message: currentInput 
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      setMessages(prev =>
        prev.filter(m => m.id !== typingId).concat({
          id: `${Date.now()}_bot`,
          text: response.data.reply || "No response",
          sender: "bot",
        })
      );
      scrollToBottom();
    } catch (error) {
      console.error("Backend error:", error);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      Alert.alert("Error", "Failed to connect to server. Make sure backend is running!");
    }
  };

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
    } else if (Platform.OS === "ios") {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Microphone permission is required");
        return;
      }

      if (recording) {
        console.log("⚠️ Already recording");
        return;
      }

      console.log("🎤 Starting recording...");
      
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
        setTimer(prev => prev + 1);
      }, 1000);

      console.log("✅ Recording started successfully");
    } catch (e) {
      console.error("❌ Recording error:", e);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log("⚠️ No recording to stop");
      return;
    }

    try {
      console.log("⏹️ Stopping recording...");
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      console.log("📍 Recording URI:", uri);

      setRecording(null);
      setTimer(0);

      if (uri) {
        console.log("🎵 Processing audio file...");
        await uploadVoice(uri);
      } else {
        console.error("❌ No URI returned from recording");
        Alert.alert("Error", "No audio recorded");
      }
    } catch (e: any) {
      console.error("❌ Stop error:", e);
      Alert.alert("Error", `Failed to stop recording: ${e.message}`);
      setRecording(null);
      setTimer(0);
    }
  };

  const uploadVoice = async (uri: string) => {
    console.log("1. 📤 Starting Upload. URI:", uri);
    setIsLoading(true);
    
    try {
      // PREPARE FORM DATA
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Web Logic: Fetch blob, then append
        console.log("2. 🌐 Processing for Web...");
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Create a file from blob (Web specific)
        const file = new File([blob], "recording.m4a", { type: "audio/m4a" });
        formData.append('file', file);
        
      } else {
        // Mobile Logic: Append object
        console.log("2. 📱 Processing for Mobile...");
        formData.append('file', {
          uri: uri,
          name: 'recording.m4a',
          type: 'audio/m4a',
        } as any);
      }

      console.log("3. 🚀 Sending to Backend:", `${API_URL}/voice`);

      const response = await fetch(`${API_URL}/voice`, {
        method: 'POST',
        headers: {
          // Important: Do NOT set Content-Type for FormData
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log("4. 📡 Response Status:", response.status);
      
      const responseText = await response.text();
      console.log("5. 📦 Raw Response:", responseText);

      if (!response.ok) {
        throw new Error(`Server Error: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      const text = data.text;

      if (!text) throw new Error("No text returned");

      // SUCCESS FLOW
      console.log("6. ✅ Transcribed:", text);

      // Add User Message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `🎤 ${text}`,
        sender: "user"
      }]);
      
      // Add Bot Typing
      const typingId = `typing-${Date.now()}`;
      setMessages(prev => [...prev, { id: typingId, text: "...", sender: "typing" }]);

      // Get Chat Response
      const chatRes = await axios.post(`${API_URL}/chat`, { message: text });
      
      // Add Bot Response
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: `${Date.now()}_bot`,
        text: chatRes.data.reply,
        sender: "bot"
      }));

    } catch (error: any) {
      console.error("❌ UPLOAD FAILED:", error);
      Alert.alert("Upload Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.sender === "typing") {
      return (
        <View style={[styles.message, styles.bot]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    return (
      <View style={[styles.message, item.sender === "user" ? styles.user : styles.bot]}>
        <Text style={item.sender === "user" ? styles.userText : styles.botText}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>FAQ Chat 💬</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👋 Start chatting or use voice!</Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Transcribing voice...</Text>
        </View>
      )}

      {recording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording: {formatTime(timer)}</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.micBtn, recording && styles.micBtnRecording]}
          onPress={recording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          <Text style={styles.micIcon}>{recording ? "⏹" : "🎤"}</Text>
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          style={[styles.input, recording && styles.inputDisabled]}
          placeholder={recording ? "Recording..." : "Type a message..."}
          editable={!recording && !isLoading}
          onSubmitEditing={sendMessage}
        />

        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || recording || isLoading) && styles.sendBtnDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim() || recording || isLoading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  header: { 
    padding: 16, 
    backgroundColor: "#007AFF", 
    alignItems: "center" 
  },
  headerText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#fff" 
  },
  messageList: { 
    padding: 16, 
    flexGrow: 1 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingTop: 80 
  },
  emptyText: { 
    fontSize: 18, 
    color: "#999" 
  },
  message: { 
    maxWidth: "80%", 
    padding: 12, 
    borderRadius: 16, 
    marginVertical: 4 
  },
  user: { 
    alignSelf: "flex-end", 
    backgroundColor: "#007AFF", 
    borderBottomRightRadius: 4 
  },
  bot: { 
    alignSelf: "flex-start", 
    backgroundColor: "#fff", 
    borderBottomLeftRadius: 4, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  userText: { 
    color: "#fff", 
    fontSize: 16 
  },
  botText: { 
    color: "#000", 
    fontSize: 16 
  },
  loadingContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 10, 
    backgroundColor: "#f0f0f0" 
  },
  loadingText: { 
    marginLeft: 8, 
    color: "#666", 
    fontSize: 14 
  },
  recordingIndicator: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#ffe5e5", 
    padding: 12 
  },
  recordingDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: "#d00", 
    marginRight: 8 
  },
  recordingText: { 
    color: "#d00", 
    fontWeight: "600", 
    fontSize: 16 
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderColor: "#e0e0e0" 
  },
  input: { 
    flex: 1, 
    backgroundColor: "#f2f2f2", 
    padding: 12, 
    marginHorizontal: 8, 
    borderRadius: 20, 
    fontSize: 16 
  },
  inputDisabled: { 
    backgroundColor: "#e8e8e8", 
    opacity: 0.6 
  },
  sendBtn: { 
    backgroundColor: "#007AFF", 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20 
  },
  sendBtnDisabled: { 
    backgroundColor: "#ccc" 
  },
  sendBtnText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  micBtn: { 
    backgroundColor: "#34C759", 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  micBtnRecording: { 
    backgroundColor: "#d00" 
  },
  micIcon: { 
    fontSize: 22 
  },
});