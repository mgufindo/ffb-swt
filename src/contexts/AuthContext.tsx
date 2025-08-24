import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { User } from "../types";
import { loginUser } from "../services/api/auth";

interface AuthContextType {
  role: string;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log("User restored from localStorage:", userData);
        }
      } catch (err) {
        console.error("Error parsing saved user data:", err);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    localStorage.removeItem("errorLogin");
    try {
      const userData = await loginUser(email, password);
      setUser(userData);

      // Simpan user ke localStorage
      const userWithTimestamp = {
        ...userData,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userWithTimestamp));
      console.log("User logged in and saved to localStorage");
    } catch (err: any) {
      localStorage.setItem("errorLogin", JSON.stringify(err.message));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setError(null);
    localStorage.removeItem("user");
    console.log("User logged out and removed from localStorage");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// EKSPORT useAuth HOOK DARI SINI
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Ekspor default untuk komponen AuthProvider
export default AuthProvider;
