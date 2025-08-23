import { getAllClients, getUserByEmail, verifyUserPassword } from '../database/crud/auth';
import { User } from '../../types';

// Ubah fungsi loginUser menjadi async sepenuhnya
export const loginUser = async (email: string, password: string): Promise<Omit<User, 'password'>> => {
  try {
    // Tunggu hasil dari getUserByEmail
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    // Tunggu hasil dari verifyUserPassword
    const isValidPassword = await verifyUserPassword(email, password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error('Login failed');
  }
};

export const getAllClient = async () => {
  try {
    const data = await getAllClients();
    return { data };
  } catch (error) {
    console.error('Error during login:', error);
    throw new Error('Login failed');
  }
};