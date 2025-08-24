import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";
import DriverManagement from "../organisms/DriverManagement";
import MillManagement from "../organisms/MillManagement";
import TripManagement from "../organisms/TripManagement";
import Analytics from "../organisms/Analytics";
import MillProductionPage from "../organisms/MillProductionPage";
import FleetManagement from "../organisms/FleetManagement";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract active tab dari URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/fleet")) return "fleet";
    if (path.includes("/drivers")) return "drivers";
    if (path.includes("/millsproduction")) return "millsproduction";
    if (path.includes("/mills")) return "mills";
    if (path.includes("/trips")) return "trips";
    if (path.includes("/analytics")) return "analytics";
    return "overview";
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (tab: string) => {
    navigate(`/dashboard/${tab}`);
    // Pada mobile, setelah memilih tab, tutup sidebar
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Handler untuk toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Tutup sidebar ketika resize window ke ukuran larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar dengan prop untuk mengontrol tampilan mobile */}
      <div
        className={`fixed inset-0 z-30 md:relative md:z-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="absolute inset-0 h-full w-full md:relative">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Overlay untuk menutup sidebar ketika diklik di area konten (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Header dengan toggle button untuk mobile */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile header replacement dengan menu button */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-10 p-4 flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-900">
            {activeTab === "fleet" && "Fleet"}
            {activeTab === "drivers" && "Drivers"}
            {activeTab === "mills" && "Mills"}
            {activeTab === "trips" && "Trips"}
            {activeTab === "millsproduction" && "Production"}
            {activeTab === "analytics" && "Analytics"}
          </h1>
        </div>

        {/* Tambahkan pt-14 pada mobile untuk memberi ruang ke Mobile Top Bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-14 md:pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:block hidden">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === "fleet" && "Fleet Management"}
                {activeTab === "drivers" && "Driver Management"}
                {activeTab === "mills" && "Mill Management"}
                {activeTab === "trips" && "Trip Management"}
                {activeTab === "millsproduction" && "Mills Production"}
                {activeTab === "analytics" && "Analytics & Reports"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.name}
              </p>
            </div>

            <Routes>
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
