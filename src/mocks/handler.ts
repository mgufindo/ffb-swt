import { http, HttpResponse } from 'msw'
import { Vehicle, VehicleStatus, VehicleType } from '../types'

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plateNumber: 'B1234ABC',
    type: 'TRUCK',
    capacity: 8,
    status: 'AVAILABLE',
    driver: {
      id: 'd1',
      name: 'John Driver',
      phoneNumber: '08123456789'
    },
    users: 'Client A'
  },
  {
      id: '2',
      plateNumber: 'B5678XYZ',
      type: 'PICKUP',
      capacity: 2,
      status: 'IN_USE',
      driver: {
          id: 'd2',
          name: 'Jane Driver',
          phoneNumber: '08987654321',
          licenseNumber: '',
          userId: '',
          status: 'AVAILABLE'
      },
      users: 'Client B',
      userId: ''
  }
]

export const handlers = [
  http.get('/api/vehicles', () => {
    return HttpResponse.json({
      data: mockVehicles,
      total: mockVehicles.length
    })
  }),
  
  http.post('/api/vehicles', async ({ request }) => {
    const vehicleData = await request.json() as Omit<Vehicle, 'id'>
    
    // Validasi kapasitas
    if (vehicleData.capacity > 12) {
      return HttpResponse.json(
        { error: 'Capacity cannot exceed 12 tons' },
        { status: 400 }
      )
    }
    
    const newVehicle = {
      ...vehicleData,
      id: Math.random().toString(36).substr(2, 9)
    }
    
    mockVehicles.push(newVehicle as Vehicle)
    
    return HttpResponse.json(newVehicle, { status: 201 })
  }),
  
  http.patch('/api/vehicles/:id', async ({ params, request }) => {
    const { id } = params
    const updates = await request.json() as Partial<Vehicle>
    
    // Validasi kapasitas
    if (updates.capacity && updates.capacity > 12) {
      return HttpResponse.json(
        { error: 'Capacity cannot exceed 12 tons' },
        { status: 400 }
      )
    }
    
    const index = mockVehicles.findIndex(v => v.id === id)
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    mockVehicles[index] = { ...mockVehicles[index], ...updates }
    
    return HttpResponse.json(mockVehicles[index])
  }),
  
  http.delete('/api/vehicles/:id', ({ params }) => {
    const { id } = params
    const index = mockVehicles.findIndex(v => v.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    mockVehicles.splice(index, 1)
    return HttpResponse.json({ success: true })
  })
]