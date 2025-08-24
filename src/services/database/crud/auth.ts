// src/services/database/crud/auth.ts
import { getDatabase } from '../config';
import { User } from '../../../types';

export const getUserByEmail = (email: string): User | null => {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT id, email, name, role, password FROM users WHERE email = ?`);
  const user = stmt.get([email]) as any;

  return user ? { 
    id: user[0],
    email: user[1],
    name: user[2],
    role: user[3],
    password: user[5],
  } : null;
};

export const verifyUserPassword = (email: string, password: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT password FROM users WHERE email = ?');
  const result = stmt.get([email]) as { password: string } | undefined;
  
  return result ? result[0] === password : false;
};

export const createUser = (user: Omit<User, 'id'>): string => {
  const db = getDatabase();
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, role, millId, password)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([id, user.email, user.name, user.role, user.password]);
  return id;
};

export const getAllClients = (): User[] => {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM users WHERE role = 'client'");
  const users: User[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject(); // hasilnya object dengan key sesuai kolom
    users.push({
      id: row.id !== null ? String(row.id) : '',
      email: row.email !== null ? String(row.email) : '',
      name: row.name !== null ? String(row.name) : '',
      role: row.role !== null ? (row.role as 'admin' | 'client') : 'client',
    });
  }

  stmt.free(); // optional: bebasin memory

  return users;
};
