import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  token: string | null;
  user: any | null;
  signIn: (userData: any, token: string) => void;
  signOut: () => void;
  updateUserData: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  signIn: () => {},
  signOut: () => {},
  updateUserData: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    setIsReady(true);
  }, []);

  const signIn = (userData: any, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    router.replace('/(tabs)');
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  };

  const updateUserData = (userData: any) => {
    setUser(userData);
  };

  useEffect(() => {
    if (!isReady || !isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoaded, isReady]);

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
