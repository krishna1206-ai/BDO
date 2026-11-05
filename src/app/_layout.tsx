import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { DesktopNav, HeaderActions, useIsWide } from '@/components/nav';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/theme';

const headerRight = () => <HeaderActions />;

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

/** Visitors must log in or register first; everything else is behind the login. */
function AppNavigator() {
  const wide = useIsWide();
  const { user, ready } = useAuth();
  const signedIn = !!user;

  // Wait for any saved session to load so signed-in users don't see the login screen flash.
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={wide && signedIn ? 'dark' : 'light'} />
      {/* Wide web windows get the website-style navbar above every page once signed in. */}
      {wide && signedIn ? <DesktopNav /> : null}
      <Stack
        screenOptions={{
          headerShown: !wide,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerRight,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Signed out: only the login and registration screens are reachable. */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms & privacy', headerShown: true, headerRight: undefined }} />
        </Stack.Protected>

        {/* Signed in: the whole app. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="menu" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ title: 'Search', headerRight: undefined, animation: 'fade' }} />
          <Stack.Screen name="service/[id]" options={{ title: 'Service' }} />
          <Stack.Screen name="insight/[id]" options={{ title: 'Insight' }} />
          <Stack.Screen name="topic/[id]" options={{ title: '' }} />
          <Stack.Screen name="insights-section/[id]" options={{ title: 'Insights' }} />
          <Stack.Screen name="events" options={{ title: 'Events' }} />
          <Stack.Screen name="careers" options={{ title: 'Careers' }} />
          <Stack.Screen name="contact" options={{ title: 'Contact us', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="offices" options={{ title: 'Our offices' }} />
          <Stack.Screen name="industries" options={{ title: 'Industries' }} />
          <Stack.Screen name="industry/[id]" options={{ title: 'Industry' }} />
          <Stack.Screen name="news" options={{ title: 'News' }} />
          <Stack.Screen name="news/[id]" options={{ title: 'News' }} />
          <Stack.Screen name="about" options={{ title: 'About us' }} />
          <Stack.Screen name="sustainability" options={{ title: 'Sustainability' }} />
          <Stack.Screen name="cyber-check" options={{ title: 'Cyber Risk Check', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="legal" options={{ title: 'Legal & privacy' }} />
          <Stack.Screen name="fraud-alert" options={{ title: 'Fraud alert' }} />
          <Stack.Screen name="sitemap" options={{ title: 'Sitemap' }} />
        </Stack.Protected>

      </Stack>
    </View>
  );
}
