import React, { createContext, useContext, useState } from 'react';

type User = {
  email: string;
  name?: string;
  role?: string;
};

type AuthContextProps = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Simulasi login
  const login = async (email: string, password: string) => {
    const demoUsers: Record<string, User> = {
      'admin@ffb.com': { email: 'admin@ffb.com', name: 'Admin', role: 'admin' },
      'client1@mill.com': { email: 'client1@mill.com', name: 'Client 1', role: 'client' },
      'client2@mill.com': { email: 'client2@mill.com', name: 'Client 2', role: 'client' },
    };
    if (demoUsers[email]) {
      setUser(demoUsers[email]);
      return demoUsers[email];
    }
    throw new Error('Login failed');
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};