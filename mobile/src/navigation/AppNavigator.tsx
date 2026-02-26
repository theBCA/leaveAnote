import React from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
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

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'leaveanote://', 'https://leaveanote.web.app'],
  config: {
    screens: {
      CreateNote: '',
      ViewNote: 'note/:noteId',
      ManageNote: 'manage/:noteId/:token',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
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
