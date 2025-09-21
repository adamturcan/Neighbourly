import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#E10600',   // Ferrari Red
    accent: '#000000',    // Black
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    onSurface: '#000000',
    onPrimary: '#ffffff',
  },
};
