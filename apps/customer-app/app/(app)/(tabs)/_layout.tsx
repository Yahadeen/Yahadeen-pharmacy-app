/**
 * Three tabs, deliberately. Home covers browsing and search, Orders covers
 * everything after checkout, Account covers profile, addresses and settings —
 * anything deeper is a stack screen pushed over the top, so only three screens
 * ever stay mounted.
 */
import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar, type TabItem } from '@/src/components';

const TABS: TabItem[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'orders', title: 'Orders', icon: 'package' },
  { name: 'account', title: 'Account', icon: 'user' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <FloatingTabBar state={state} navigation={navigation} tabs={TABS} />
      )}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
