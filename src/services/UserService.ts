import { Treasure } from '../components/GameCanvas';

// User interface for storage
interface User {
  id: string;
  walletAddress?: string;
  email?: string;
  walletType?: 'metamask' | 'phantom' | 'email' | 'other';
  treasures: Treasure[];
  score: number;
  lastLogin: string;
}

// Mock database - would be replaced with real DB/API calls in production
class UserService {
  private readonly STORAGE_KEY = 'treasureHunt_userData';
  
  // Get all users
  getAllUsers(): User[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) return [];
    
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return [];
    }
  }
  
  // Find user by ID (wallet address or email)
  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => 
      user.id === id || 
      user.walletAddress === id || 
      user.email === id
    ) || null;
  }
  
  // Create or update user
  saveUser(userData: Partial<User> & { id: string }): User {
    const users = this.getAllUsers();
    const existingUserIndex = users.findIndex(u => u.id === userData.id);
    
    const updatedUser: User = {
      id: userData.id,
      walletAddress: userData.walletAddress || '',
      email: userData.email || '',
      walletType: userData.walletType || 'other',
      treasures: userData.treasures || [],
      score: userData.score || 0,
      lastLogin: new Date().toISOString(),
    };
    
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        ...updatedUser,
        lastLogin: new Date().toISOString(),
      };
    } else {
      // Add new user
      users.push(updatedUser);
    }
    
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    
    return updatedUser;
  }
  
  // Add treasure to user
  addTreasureToUser(userId: string, treasure: Treasure): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    
    // Check if treasure is already in collection (prevent duplicates)
    const treasureKey = `${treasure.x}-${treasure.y}`;
    const hasTreasure = user.treasures.some(t => `${t.x}-${t.y}` === treasureKey);
    
    if (!hasTreasure) {
      user.treasures.push(treasure);
      
      // Calculate value to add to score
      const valueMap: {[key: string]: number} = {
        'Common': 10,
        'Uncommon': 50,
        'Rare': 200,
        'Epic': 500,
        'Legendary': 1000
      };
      
      const treasureValue = valueMap[treasure.rarity || 'Common'] || 10;
      user.score += treasureValue;
      
      return this.saveUser(user);
    }
    
    return user;
  }
  
  // Clear user data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const userService = new UserService();
export type { User };
