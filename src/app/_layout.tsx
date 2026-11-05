import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { DesktopNav, HeaderActions, useIsWide } from '@/components/nav';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/theme';

const headerRight = () => <HeaderActions />;

export default function RootLayout() {
  const wide = useIsWide();

  return (
    <AuthProvider>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={wide ? 'dark' : 'light'} />
      {/* Wide web windows get the website-style navbar above every page instead of native headers. */}
      {wide ? <DesktopNav /> : null}
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ title: 'Search', headerRight: undefined, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ title: 'Log in', headerRight: undefined, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="register" options={{ title: 'Create account', headerRight: undefined, animation: 'slide_from_bottom' }} />
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
      </Stack>
    </View>
    </AuthProvider>
  );
}
