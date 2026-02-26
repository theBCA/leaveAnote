import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../config/theme';
import CreateNoteScreen from '../screens/CreateNoteScreen';
import ViewNoteScreen from '../screens/ViewNoteScreen';
import ManageNoteScreen from '../screens/ManageNoteScreen';

export type RootStackParamList = {
  CreateNote: { isReply?: boolean; replyTo?: string };
  ViewNote: { noteId: string };
  ManageNote: { noteId: string; token: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CreateNote"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="CreateNote"
          component={CreateNoteScreen}
          options={{ title: 'LeaveANote', headerShown: false }}
        />
        <Stack.Screen
          name="ViewNote"
          component={ViewNoteScreen}
          options={{ title: 'View Note' }}
        />
        <Stack.Screen
          name="ManageNote"
          component={ManageNoteScreen}
          options={{ title: 'Control Panel' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
