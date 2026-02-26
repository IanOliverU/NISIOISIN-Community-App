import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TabLayout() {
  const tabTintColor = useThemeColor({}, 'tint');
  const tabInactiveColor = useThemeColor({}, 'tabIconDefault');
  const tabBackgroundColor = useThemeColor({}, 'background');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabTintColor,
        tabBarInactiveTintColor: tabInactiveColor,
        tabBarStyle: { backgroundColor: tabBackgroundColor },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Light Novel',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="library.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="manga"
        options={{
          title: 'Manga',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="history" color={color} />,
        }}
      />
    </Tabs>
  );
}
