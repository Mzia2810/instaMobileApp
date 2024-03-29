import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { LoadScreen, WalkthroughScreen } from '../Core/onboarding'
import MainStackNavigator from './MainStackNavigator'
import LoginStack from './AuthStackNavigator'
import { NavigationContainer } from '@react-navigation/native'

const Stack = createStackNavigator()

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animationEnabled: false }}
      initialRouteName="MainStack">
      <Stack.Screen name="LoadScreen" component={LoadScreen} />
      <Stack.Screen name="Walkthrough" component={WalkthroughScreen} />
      <Stack.Screen name="LoginStack" component={LoginStack} />
      <Stack.Screen name="MainStack" component={MainStackNavigator} />
    </Stack.Navigator>
  )
}

const RootStack = () => {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  )
}

export default RootNavigator
