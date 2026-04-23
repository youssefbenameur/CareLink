
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define types
export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  status: 'active' | 'suspended';
  doctorVerificationStatus?: 'pending' | 'approved' | 'rejected' | 'resubmit';
  joinedDate?: Date | Timestamp;
  lastLogin?: Date | Timestamp;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface SupportTicket {
  id?: string;
  user: string;
  userId: string;
  issue: string;
  description?: string;
  type: 'technical' | 'billing' | 'access' | 'appointment' | 'other';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  time?: Date | Timestamp;
}

export interface SystemStat {
  totalUsers: number;
  activeDoctors: number;
  activePatients: number;
  systemHealth: string;
}

// Mock data for initial development
const mockUsers: User[] = [
  {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    status: 'active',
    joinedDate: new Date('2023-01-15'),
    lastLogin: new Date('2023-05-01')
  },
  {
    id: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'doctor',
    status: 'active',
    joinedDate: new Date('2023-02-20'),
    lastLogin: new Date('2023-04-28')
  },
  {
    id: 'user3',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@example.com',
    role: 'patient',
    status: 'active',
    joinedDate: new Date('2023-03-10'),
    lastLogin: new Date('2023-03-15')
  }
];

const mockSupportTickets: SupportTicket[] = [
  {
    id: 'ticket1',
    user: 'John Smith',
    userId: 'user4',
    issue: 'Account access problem',
    description: 'Unable to login after password reset',
    type: 'access',
    status: 'Open',
    priority: 'high',
    createdAt: new Date('2023-04-29'),
    time: new Date('2023-05-03T09:02:39')
  },
  {
    id: 'ticket2',
    user: 'John Smith',
    userId: 'user4',
    issue: 'Account access problem',
    description: 'Second login attempt failed',
    type: 'access',
    status: 'Open',
    priority: 'high',
    createdAt: new Date('2023-04-30'),
    time: new Date('2023-05-03T09:02:39')
  }
];

// Admin Service API
export const adminService = {
  // User Management
  async getUsers(pageSize = 10, lastDoc?: any, filters?: any) {
    try {
      // For development without Firebase, return mock data
      if (!db) {
        console.log('No Firebase instance - returning mock data');
        return {
          users: mockUsers,
          lastDoc: null,
          totalCount: mockUsers.length
        };
      }

      // Build query
      let usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(pageSize));

      // Apply filters if any
      if (filters) {
        if (filters.role && filters.role !== 'all') {
          usersQuery = query(usersQuery, where('role', '==', filters.role));
        }
        if (filters.status && filters.status !== 'all') {
          usersQuery = query(usersQuery, where('status', '==', filters.status));
        }
        // Add more filters as needed
      }

      // Apply pagination
      if (lastDoc) {
        usersQuery = query(usersQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(usersQuery);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        // Convert Firestore Timestamps to Date objects
        if (data.joinedDate && 'toDate' in data.joinedDate) {
          data.joinedDate = data.joinedDate.toDate();
        }
        if (data.lastLogin && 'toDate' in data.lastLogin) {
          data.lastLogin = data.lastLogin.toDate();
        }
        users.push({
          ...data,
          id: doc.id
        });
      });

      // Get total count - this is inefficient for large collections and should be handled differently in production
      const countSnapshot = await getDocs(collection(db, 'users'));

      return {
        users,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        totalCount: countSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  async getUser(id: string) {
    try {
      if (!db) {
        const user = mockUsers.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
      }

      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('User not found');
      }

      const data = docSnap.data() as User;
      // Convert Firestore Timestamps to Date objects
      if (data.joinedDate && 'toDate' in data.joinedDate) {
        data.joinedDate = data.joinedDate.toDate();
      }
      if (data.lastLogin && 'toDate' in data.lastLogin) {
        data.lastLogin = data.lastLogin.toDate();
      }

      return {
        ...data,
        id: docSnap.id
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  },

  async createUser(user: User) {
    try {
      if (!db) {
        const newUser = {
          ...user,
          id: `user${Number(mockUsers.length + 1)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockUsers.push(newUser);
        return newUser;
      }

      // Add timestamps
      const userWithTimestamps = {
        ...user,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users'), userWithTimestamps);
      return {
        ...user,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  async updateUser(id: string, userData: Partial<User>) {
    try {
      if (!db) {
        const index = mockUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        mockUsers[index] = {
          ...mockUsers[index],
          ...userData,
          updatedAt: new Date()
        };
        return mockUsers[index];
      }

      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now()
      });

      // Fetch and return the updated user
      const updatedDocSnap = await getDoc(userRef);
      return {
        ...updatedDocSnap.data() as User,
        id: updatedDocSnap.id
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  async deleteUser(id: string) {
    try {
      if (!db) {
        const index = mockUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        mockUsers.splice(index, 1);
        return true;
      }

      await deleteDoc(doc(db, 'users', id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },

  // System Statistics
  async getStats(): Promise<SystemStat> {
    try {
      if (!db) {
        // Mock stats
        return {
          totalUsers: 5,
          activeDoctors: 0,
          activePatients: 0,
          systemHealth: '99.9%'
        };
      }

      // Get user counts
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Count active doctors
      const doctorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'doctor'),
        where('status', '==', 'active')
      );
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const activeDoctors = doctorsSnapshot.size;

      // Count active patients
      const patientsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'patient'),
        where('status', '==', 'active')
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const activePatients = patientsSnapshot.size;

      // In a real application, system health would be fetched from a monitoring service
      const systemHealth = '99.9%';

      return {
        totalUsers,
        activeDoctors,
        activePatients,
        systemHealth
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw new Error('Failed to fetch system statistics');
    }
  },

  // Support Tickets
  async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      if (!db) {
        // For development without Firebase, convert any mock Timestamp objects to Date
        return mockSupportTickets.map(ticket => {
          return {
            ...ticket,
            createdAt: ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt as any),
            time: ticket.time instanceof Date ? ticket.time : new Date(ticket.time as any)
          };
        });
      }

      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(ticketsQuery);
      const tickets: SupportTicket[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SupportTicket;

        // Convert Firestore Timestamps to Date objects
        const createdAt = data.createdAt && 'toDate' in data.createdAt
          ? data.createdAt.toDate()
          : data.createdAt;

        const updatedAt = data.updatedAt && 'toDate' in data.updatedAt
          ? data.updatedAt.toDate()
          : data.updatedAt;

        const time = data.time && 'toDate' in data.time
          ? data.time.toDate()
          : data.time;

        tickets.push({
          ...data,
          id: doc.id,
          createdAt: createdAt as Date,
          updatedAt: updatedAt as Date,
          time: time as Date
        });
      });

      return tickets;
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      throw new Error('Failed to fetch support tickets');
    }
  },
};

export default adminService;
