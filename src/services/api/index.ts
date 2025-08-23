// src/services/api/index.ts
export { fetchVehicles, fetchVehicle, addVehicle, modifyVehicle, removeVehicle } from './vehicles';
export { fetchDrivers, fetchDriver, addDriver, modifyDriver, removeDriver } from './drivers';
export { fetchMills, fetchMill, addMill, modifyMill, removeMill } from './mills';
export { fetchTrips, fetchTrip, addTrip, modifyTrip, removeTrip } from './trips';
export { fetchCollections, fetchCollection, addCollection, modifyCollection, removeCollection } from './collections';
export { loginUser } from './auth';