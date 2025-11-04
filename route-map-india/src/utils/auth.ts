// Authentication utilities
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Store token in localStorage
export const authUtils = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('auth_user');
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  // Register new user
  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!isJson) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 300));
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`Server returned HTML. Check if backend is running at ${API_BASE_URL}`);
        }
        throw new Error(`Server error: Expected JSON but got ${contentType || 'unknown'}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || `Registration failed: ${response.status} ${response.statusText}`;
        console.error('Registration error:', errorMsg, data);
        throw new Error(errorMsg);
      }

      authUtils.setToken(data.token);
      authUtils.setUser(data.user);
      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Make sure backend is running at ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!isJson) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 300));
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`Server returned HTML. Check if backend is running at ${API_BASE_URL}`);
        }
        throw new Error(`Server error: Expected JSON but got ${contentType || 'unknown'}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      authUtils.setToken(data.token);
      authUtils.setUser(data.user);
      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Make sure backend is running at ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  // Logout
  logout: (): void => {
    authUtils.removeToken();
    authUtils.removeUser();
  },

  // Login with Google OAuth
  loginWithGoogle: async (googleCredential: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: googleCredential }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!isJson) {
        const text = await response.text();
        console.error('Non-JSON response from server:', text.substring(0, 300));
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`Server returned HTML instead of JSON. This usually means the endpoint doesn't exist (404) or the server crashed. Check if backend is running at ${API_BASE_URL}/auth/google`);
        }
        throw new Error(`Server error: Expected JSON but got ${contentType || 'unknown'}. Response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Google login failed: ${response.status} ${response.statusText}`);
      }

      authUtils.setToken(data.token);
      // Ensure all user fields are properly set
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split('@')[0],
        picture: data.user.picture || null,
      };
      console.log('Google login - received from backend:', data);
      console.log('Google login - picture from backend:', data.user.picture);
      console.log('Google login - storing user:', userData);
      authUtils.setUser(userData);
      return { ...data, user: userData };
    } catch (error: any) {
      // Handle network/CORS errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Make sure backend is running at ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  // Get authorization header for API requests
  getAuthHeader: (): { Authorization: string } | {} => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

