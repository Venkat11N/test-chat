import { StyleSheet } from "react-native";
import { COLORS } from "../constants/themes";

// Styles for the main Chat Screen
export const screenStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: { 
    padding: 16, 
    backgroundColor: COLORS.primary, 
    alignItems: "center" 
  },
  headerText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: COLORS.white 
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
    color: COLORS.grayDark 
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
    backgroundColor: COLORS.recordingBg, 
    padding: 12 
  },
  recordingDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: COLORS.micRecording, 
    marginRight: 8 
  },
  recordingText: { 
    color: COLORS.micRecording, 
    fontWeight: "600", 
    fontSize: 16 
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    backgroundColor: COLORS.white, 
    borderTopWidth: 1, 
    borderColor: COLORS.border 
  },
  input: { 
    flex: 1, 
    backgroundColor: COLORS.grayLight, 
    padding: 12, 
    marginHorizontal: 8, 
    borderRadius: 20, 
    fontSize: 16 
  },
  inputDisabled: { 
    backgroundColor: COLORS.grayMedium, 
    opacity: 0.6 
  },
  sendBtn: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20 
  },
  sendBtnDisabled: { 
    backgroundColor: "#ccc" 
  },
  sendBtnText: { 
    color: COLORS.white, 
    fontWeight: "600" 
  },
  micBtn: { 
    backgroundColor: COLORS.micActive, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  micBtnRecording: { 
    backgroundColor: COLORS.micRecording 
  },
  micIcon: { 
    fontSize: 22 
  },
});

// Styles for the individual Message Bubbles
export const bubbleStyles = StyleSheet.create({
  message: { 
    maxWidth: "80%", 
    padding: 12, 
    borderRadius: 16, 
    marginVertical: 4 
  },
  user: { 
    alignSelf: "flex-end", 
    backgroundColor: COLORS.primary, 
    borderBottomRightRadius: 4 
  },
  bot: { 
    alignSelf: "flex-start", 
    backgroundColor: COLORS.white, 
    borderBottomLeftRadius: 4, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  userText: { 
    color: COLORS.textUser, 
    fontSize: 16 
  },
  botText: { 
    color: COLORS.textBot, 
    fontSize: 16 
  },
});