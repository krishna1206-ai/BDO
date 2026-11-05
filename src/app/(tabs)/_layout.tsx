import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { HeaderActions, useIsWide } from '@/components/nav';
import type { IconName } from '@/data/content';
import { colors } from '@/theme';

function makeIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  }
  return TabIcon;
}

const headerRight = () => <HeaderActions />;

export default function TabLayout() {
  const wide = useIsWide();

  return (
    <Tabs
      screenOptions={{
        // On wide web windows the website-style navbar replaces both the headers and the tab bar.
        headerShown: !wide,
        tabBarStyle: wide ? { display: 'none' } : undefined,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerRight,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'shift',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: makeIcon('home-outline') }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: makeIcon('grid-outline') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: makeIcon('newspaper-outline') }} />
      <Tabs.Screen name="advisers" options={{ title: 'Advisers', tabBarIcon: makeIcon('people-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: makeIcon('menu-outline') }} />
    </Tabs>
  );
}
