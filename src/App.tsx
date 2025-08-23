import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initializeDatabase, saveDatabase } from './services/database/config'; // Tambahkan saveDatabase
import { initDatabaseSchema } from './services/database/schema';
import { seedInitialData } from './services/database/seed';
import Login from './components/pages/Login';
import Dashboard from './components/templates/Dashboard';
import ProtectedRoute from './components/atoms/ProtectedRoute';
import Unauthorized from './components/pages/Unauthorized';
import LoadingSpinner from './components/atoms/LoadingSpinner';

// Komponen wrapper untuk handle initialization
const AppContent: React.FC = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        await initDatabaseSchema(); // Tambahkan await jika async
        await seedInitialData(); // Tambahkan await jika async
        setDbInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
      }
    };

    initApp();
  }, []);

  // Auto-save ketika aplikasi ditutup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dbInitialized) {
        saveDatabase();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dbInitialized]);

  // Tampilkan loading selama initializing
  if (!dbInitialized && !initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Initialization Error</h1>
          <p className="mt-2 text-gray-600">{initError}</p>
          <button
            onClick={() => {
              localStorage.removeItem('palm_oil_database'); // Clear corrupted data
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Reset & Reload
          </button>
        </div>
      </div>
    );
  }

  // Tampilkan loading selama auth checking
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        isAuthenticated ? 
        <Navigate to="/dashboard" replace /> : 
        <Navigate to="/login" replace />
      } />
      {/* Fallback route untuk handling 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
};

export default App;