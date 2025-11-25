import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Message } from "../types";
import { bubbleStyles as styles } from "../styles/chatStyles"; 

export const MessageBubble = ({ item }: { item: Message }) => {
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