import { Platform } from 'react-native';

// Si usas emulador de Android: 10.0.2.2
// Si usas emulador de iOS o dispositivo físico en la misma red: Tu IP Local
// Por defecto usaremos localhost:3000 pero permitimos configurarlo
export const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

console.log('API Base URL:', BASE_URL);
