import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import AccountDetailScreen from '../screens/accounts/AccountDetailScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import ApprovalsScreen from '../screens/approvals/ApprovalsScreen';
import ApprovalDetailScreen from '../screens/approvals/ApprovalDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Each tab gets its own stack for nested navigation
function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Početna' }} />
    </Stack.Navigator>
  );
}

function AccountsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Accounts"       component={AccountsScreen}       options={{ title: 'Računi' }} />
      <Stack.Screen name="AccountDetail"  component={AccountDetailScreen}  options={{ title: 'Detalji računa' }} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Plaćanja' }} />
    </Stack.Navigator>
  );
}

function ApprovalsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Verifikacija' }} />
      <Stack.Screen name="ApprovalDetail" component={ApprovalDetailScreen} options={{ title: 'Detalji zahteva' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { borderTopColor: colors.border },
    }}>
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Početna' }} />
      <Tab.Screen name="AccountsTab" component={AccountsStack} options={{ title: 'Računi' }} />
      <Tab.Screen name="PaymentsTab" component={PaymentsStack} options={{ title: 'Plaćanja' }} />
      <Tab.Screen name="ApprovalsTab" component={ApprovalsStack} options={{ title: 'Verifikacija' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
