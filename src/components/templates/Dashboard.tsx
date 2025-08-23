import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../organisms/Sidebar';
import Header from '../organisms/Header';
import DriverManagement from '../organisms/DriverManagement';
import MillManagement from '../organisms/MillManagement';
import TripManagement from '../organisms/TripManagement';
import Analytics from '../organisms/Analytics';
import MillProductionPage from '../organisms/MillProductionPage';
import FleetManagement from '../organisms/FleetManagement';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active tab dari URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/fleet')) return 'fleet';
    if (path.includes('/drivers')) return 'drivers';
    if (path.includes('/millsproduction')) return 'millsproduction';
    if (path.includes('/mills')) return 'mills';
    if (path.includes('/trips')) return 'trips';
    if (path.includes('/analytics')) return 'analytics';
    return 'overview';
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (tab: string) => {
    navigate(`/dashboard/${tab}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'fleet' && 'Fleet Management'}
                {activeTab === 'drivers' && 'Driver Management'}
                {activeTab === 'mills' && 'Mill Management'}
                {activeTab === 'trips' && 'Trip Management'}
                {activeTab === 'millsproduction' && 'Mills Production'}
                {activeTab === 'analytics' && 'Analytics & Reports'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.name}
              </p>
            </div>
            
            <Routes>
              <Route path="/" element={<Navigate to="overview" replace />} />
              <Route path="fleet" element={<FleetManagement />} />
              <Route path="drivers" element={<DriverManagement />} />
              <Route path="mills" element={<MillManagement />} />
              <Route path="trips" element={<TripManagement />} />
              <Route path="millsproduction" element={<MillProductionPage />} />
              <Route path="analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;