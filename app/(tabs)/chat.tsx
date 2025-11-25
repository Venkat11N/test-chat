import React, { useState, useRef } from "react";
import { View, TextInput, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Imports
import { Message } from "../../src/types";
import { sendTextMessage, uploadVoiceMessage } from "../../src/services/chatService";
import { useAudioRecorder } from "../../src/hooks/useAudioRecorder";
import { MessageBubble } from "../../src/components/MessageBubble";
import { screenStyles as styles } from "../../src/styles/chatStyles"; 

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { recording, timer, startRecording, stopRecording } = useAudioRecorder();
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const addMessage = (text: string, sender: Message['sender'], idOverride?: string) => {
    const msg: Message = { id: idOverride || Date.now().toString(), text, sender };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
    return msg.id;
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleSendText = async () => {
    if (!input.trim()) return;
    const currentText = input;
    setInput("");
    
    addMessage(currentText, "user");
    const typingId = addMessage("...", "typing", `typing-${Date.now()}`);

    try {
      const reply = await sendTextMessage(currentText);
      removeMessage(typingId);
      addMessage(reply || "No response", "bot");
    } catch (error) {
      removeMessage(typingId);
      Alert.alert("Error", "Failed to connect to bot.");
    }
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (!uri) return;

    setIsLoading(true);
    try {
      const data = await uploadVoiceMessage(uri);
      const transcribedText = data.text;
      
      if (!transcribedText) throw new Error("No text returned");
      
      addMessage(`🎤 ${transcribedText}`, "user");
      
      const typingId = addMessage("...", "typing", `typing-${Date.now()}`);
      const reply = await sendTextMessage(transcribedText);
      
      removeMessage(typingId);
      addMessage(reply, "bot");

    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        renderItem={({ item }) => <MessageBubble item={item} />}
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
          onPress={recording ? handleStopRecording : startRecording}
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
          onSubmitEditing={handleSendText}
        />

        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || recording || isLoading) && styles.sendBtnDisabled]} 
          onPress={handleSendText}
          disabled={!input.trim() || recording || isLoading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}