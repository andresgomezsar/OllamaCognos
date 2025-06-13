import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// Define user type
export interface User {
  id: number;
  username: string;
  password: string;
  email: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// File to store users
const USER_FILE = path.join(process.cwd(), '.local-users.json');

// In-memory user store (loaded from file)
let users: User[] = [];

// Initialize the local user storage
export function initLocalUsers() {
  try {
    // Check if user file exists
    if (fs.existsSync(USER_FILE)) {
      const data = fs.readFileSync(USER_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`Loaded ${users.length} users from local storage`);
    } else {
      console.log('No local users found, will create default admin');
      users = [];
    }
  } catch (error) {
    console.error('Error loading local users:', error);
    users = [];
  }
}

// Save users to file
function saveUsers() {
  try {
    fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users to file:', error);
  }
}

// Find a user by ID
export function findUserById(id: number): User | undefined {
  return users.find(user => user.id === id);
}

// Find a user by username
export function findUserByUsername(username: string): User | undefined {
  return users.find(user => user.username === username);
}

// Create the admin user if no users exist
export async function createAdminUser(): Promise<void> {
  if (users.length === 0) {
    const adminUsername = 'god_mode_1';
    const adminPassword = 'Quickness-Candy-Resolved-Explore6-Dice';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser: User = {
      id: 1,
      username: adminUsername,
      email: 'admin@example.com',
      password: hashedPassword,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.push(adminUser);
    saveUsers();
    
    console.log('\n🔐 Admin user created with the following credentials:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  You can now log in with these credentials.');
  }
}

// Verify a user's credentials
export async function verifyUser(username: string, password: string): Promise<User | false> {
  const user = findUserByUsername(username);
  
  if (!user) {
    return false;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return false;
  }
  
  // Update last login
  user.lastLogin = new Date();
  saveUsers();
  
  return user;
}

// Register a new user
export async function registerUser(username: string, password: string, email?: string | null): Promise<User> {
  // Check if user already exists
  if (findUserByUsername(username)) {
    throw new Error('Username already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Generate next ID
  const nextId = users.length > 0 
    ? Math.max(...users.map(user => user.id)) + 1
    : 1;
  
  // Create new user
  const newUser: User = {
    id: nextId,
    username,
    password: hashedPassword,
    email: email || null,
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.push(newUser);
  saveUsers();
  
  return newUser;
}

// Change a user's password
export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = findUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update password
  user.password = hashedPassword;
  user.updatedAt = new Date();
  saveUsers();
  
  return true;
}
