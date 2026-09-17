/**
 * Three tabs, deliberately. Queue covers everything an attendant does with
 * orders, Inventory covers the shelf, Account covers the person and the
 * settings — anything deeper is a stack screen pushed over the top, so only
 * three screens ever stay mounted.
 */
import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar, type TabItem } from '@/src/components';

const TABS: TabItem[] = [
  { name: 'index', title: 'Queue', icon: 'list' },
  { name: 'inventory', title: 'Inventory', icon: 'package' },
  { name: 'support', title: 'Support', icon: 'message-circle' },
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
