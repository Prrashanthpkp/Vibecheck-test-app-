import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { View, ActivityIndicator } from 'react-native';
import SplashScreen from './splash';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  function handleSplashDone() {
    setShowSplash(false);
    if (authChecked) {
      router.replace(isLoggedIn ? '/(tabs)' : '/(auth)/login');
    }
  }

  useEffect(() => {
    if (!showSplash && authChecked) {
      router.replace(isLoggedIn ? '/(tabs)' : '/(auth)/login');
    }
  }, [showSplash, authChecked, isLoggedIn]);

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}