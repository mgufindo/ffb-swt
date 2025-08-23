// src/components/organisms/Analytics.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchTrips } from '../../services/api/trips';
import { fetchCollections } from '../../services/api/collections';
import { fetchVehicles } from '../../services/api/vehicles';
import { fetchDrivers } from '../../services/api/drivers';
import { fetchMills } from '../../services/api/mills';
import { Trip, Collection, Vehicle, Driver, Mill } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import LoadingSpinner from '../atoms/LoadingSpinner';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [mills, setMills] = useState<Mill[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const millId = user?.role === 'client' ? user.millId : undefined;
      
      // Fetch all necessary data
      const tripsData = await fetchTrips(1, 1000, millId);
      const collectionsData = await fetchCollections(1, 1000, millId);
      const vehiclesData = await fetchVehicles(1, 1000, millId);
      const driversData = await fetchDrivers(1, 1000);
      const millsData = await fetchMills(1, 1000);
      
      setTrips(tripsData.data);
      setCollections(collectionsData.data);
      setVehicles(vehiclesData.data);
      setDrivers(driversData.data);
      setMills(millsData.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalCollections = collections.length;
    const totalWeight = collections.reduce((sum, c) => sum + c.weight, 0);
    const avgCollection = totalCollections ? totalWeight / totalCollections : 0;
    const completionRate = trips.length ? 
      (trips.filter(t => t.status === 'COMPLETED').length / trips.length) * 100 : 0;
    
    const activeTrips = trips.filter(t => t.status === 'IN_PROGRESS').length;
    const scheduledTrips = trips.filter(t => t.status === 'SCHEDULED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE').length;

    return {
      totalCollections,
      totalWeight,
      avgCollection,
      completionRate,
      activeTrips,
      scheduledTrips,
      availableVehicles,
      availableDrivers,
      totalVehicles: vehicles.length,
      totalDrivers: drivers.length,
      totalMills: mills.length
    };
  }, [trips, collections, vehicles, drivers, mills]);

  // Process data for charts
  const processTripStatusData = () => {
    const statusCount = {
      SCHEDULED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    
    trips.forEach(trip => {
      statusCount[trip.status]++;
    });
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const processCollectionTrendData = () => {
    // Group collections by date for the selected time range
    const now = new Date();
    let daysToShow = 7;
    
    if (timeRange === 'month') daysToShow = 30;
    if (timeRange === 'year') daysToShow = 12; // Will show months
    
    const result = [];
    
    if (timeRange === 'year') {
      // Monthly data for year view
      const monthlyData: { [month: string]: number } = {};
      
      collections.forEach(collection => {
        const date = new Date(collection.timestamp);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + collection.weight;
      });
      
      return Object.entries(monthlyData)
        .map(([month, weight]) => ({ date: month, weight }))
        .sort((a, b) => {
          const [aMonth, aYear] = a.date.split('/').map(Number);
          const [bMonth, bYear] = b.date.split('/').map(Number);
          return aYear - bYear || aMonth - bMonth;
        })
        .slice(-daysToShow);
    } else {
      // Daily data for week/month view
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const dateStr = timeRange === 'week' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayCollections = collections.filter(c => {
          const colDate = new Date(c.timestamp);
          return colDate.toDateString() === date.toDateString();
        });
        
        const dailyWeight = dayCollections.reduce((sum, c) => sum + c.weight, 0);
        
        result.push({
          date: dateStr,
          weight: dailyWeight,
          collections: dayCollections.length
        });
      }
    }
    
    return result;
  };

  const processVehicleUtilization = () => {
    const statusCount = {
      'In Use': trips.filter(t => t.status === 'IN_PROGRESS').length,
      'Available': vehicles.filter(v => v.status === 'AVAILABLE').length,
      'Maintenance': vehicles.filter(v => v.status === 'MAINTENANCE').length,
      'Unavailable': vehicles.filter(v => v.status === 'UNAVAILABLE').length
    };
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const processDriverStatusData = () => {
    const statusCount = {
      'Available': drivers.filter(d => d.status === 'AVAILABLE').length,
      'On Trip': drivers.filter(d => d.status === 'ON_TRIP').length,
      'Off Duty': drivers.filter(d => d.status === 'OFF_DUTY').length,
      'Sick': drivers.filter(d => d.status === 'SICK').length
    };
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const processTopMillsData = () => {
    const millCollections: { [millId: string]: { name: string; weight: number; collections: number } } = {};
    
    collections.forEach(collection => {
      if (!millCollections[collection.millId]) {
        const mill = mills.find(m => m.id === collection.millId);
        millCollections[collection.millId] = {
          name: mill?.name || 'Unknown Mill',
          weight: 0,
          collections: 0
        };
      }
      
      millCollections[collection.millId].weight += collection.weight;
      millCollections[collection.millId].collections++;
    });
    
    return Object.values(millCollections)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const STATUS_COLORS = {
    SCHEDULED: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive overview of your operations</p>
        </div>
        
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'year' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Collections</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalCollections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeTrips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.completionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalWeight.toFixed(0)} tons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Collection Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={processCollectionTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="weight" 
                fill="#8884d8" 
                stroke="#8884d8" 
                fillOpacity={0.2}
                name="Weight (tons)"
              />
              <Bar 
                yAxisId="right"
                dataKey="collections" 
                fill="#82ca9d" 
                name="Collections"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Trip Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processTripStatusData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="value" 
                fill={(data) => STATUS_COLORS[data.name as keyof typeof STATUS_COLORS] || '#8884d8'}
                name="Trips"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Vehicle Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processVehicleUtilization()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {processVehicleUtilization().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Driver Availability</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processDriverStatusData()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {processDriverStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Mills */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Top Performing Mills</h3>
          <div className="space-y-3">
            {processTopMillsData().map((mill, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${index < 3 ? 'bg-green-500' : 'bg-gray-400'} mr-3`}></div>
                  <span className="font-medium">{mill.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{mill.weight.toFixed(0)} tons</div>
                  <div className="text-sm text-gray-500">{mill.collections} collections</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Availability */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Resource Availability</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Vehicles</span>
                <span className="text-sm font-semibold">{metrics.availableVehicles}/{metrics.totalVehicles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.availableVehicles / metrics.totalVehicles) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Drivers</span>
                <span className="text-sm font-semibold">{metrics.availableDrivers}/{metrics.totalDrivers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.availableDrivers / metrics.totalDrivers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-medium text-lg mb-4">Quick Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Collection Weight</span>
              <span className="font-semibold">{metrics.avgCollection.toFixed(1)} tons</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Scheduled Trips</span>
              <span className="font-semibold">{metrics.scheduledTrips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Mills</span>
              <span className="font-semibold">{metrics.totalMills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Drivers</span>
              <span className="font-semibold">{metrics.availableDrivers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;