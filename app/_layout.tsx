import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Audio } from 'expo-av';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        console.log("🎧 Audio ready");
      } catch (e) {
        console.log("Audio error:", e);
      }
    })();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}