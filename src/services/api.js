import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8085';
const API_TIMEOUT = 10000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Class
class APIService {
  // Auth endpoints
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Login failed',
      };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  }

  // User endpoints
  async getAvailableBooks() {
    try {
      const response = await api.get('/api/user/books/available');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch books',
        data: [],
      };
    }
  }

  async searchBooks(query) {
    try {
      const response = await api.get(`/api/user/books/search?query=${encodeURIComponent(query)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Search failed',
        data: [],
      };
    }
  }

  async getBookById(id) {
    try {
      const response = await api.get(`/api/user/books/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch book details',
      };
    }
  }

  async bookBook(bookingData) {
    try {
      const response = await api.post('/api/user/books/book', bookingData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to book the book',
      };
    }
  }

  async getUserBookings() {
    try {
      const response = await api.get('/api/user/bookings');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch bookings',
        data: [],
      };
    }
  }

  async getActiveBookings() {
    try {
      const response = await api.get('/api/user/bookings/active');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch active bookings',
        data: [],
      };
    }
  }

  async returnBook(bookingId) {
    try {
      const response = await api.put(`/api/user/bookings/${bookingId}/return`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to return book',
      };
    }
  }

  async sendChatMessage(message, language = 'en') {
    try {
      const response = await api.post('/api/user/chat', {
        message,
        language,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to send message',
      };
    }
  }

  // Generic POST method for direct API calls
  async post(endpoint, data) {
    const response = await api.post(endpoint, data);
    return response;
  }

  // Generic GET method for direct API calls
  async get(endpoint) {
    const response = await api.get(endpoint);
    return response;
  }

  // Admin endpoints
  async getAllBooks() {
    try {
      const response = await api.get('/api/admin/books');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch all books: ${error.response?.status} ${error.response?.data || error.message}`,
        data: [],
      };
    }
  }

  async createBook(bookData) {
    try {
      const response = await api.post('/api/admin/books', bookData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to create book',
      };
    }
  }

  async updateBook(id, bookData) {
    try {
      const response = await api.put(`/api/admin/books/${id}`, bookData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update book',
      };
    }
  }

  async deleteBook(id) {
    try {
      const response = await api.delete(`/api/admin/books/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete book',
      };
    }
  }

  async updateBookQuantity(id, quantity) {
    try {
      const response = await api.put(`/api/admin/books/${id}/quantity?quantity=${quantity}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update book quantity',
      };
    }
  }

  async getAllUsers() {
    try {
      console.log('Making request to /api/admin/users');
      const response = await api.get('/api/admin/users');
      console.log('Admin users response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Admin users error:', error.response?.status, error.response?.data);
      return {
        success: false,
        error: `Failed to fetch users: ${error.response?.status} ${error.response?.data || error.message}`,
        data: [],
      };
    }
  }

  async getUserById(id) {
    try {
      const response = await api.get(`/api/admin/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to fetch user',
      };
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await api.put(`/api/admin/users/${id}`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update user',
      };
    }
  }

  async deleteUser(id) {
    try {
      const response = await api.delete(`/api/admin/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to delete user',
      };
    }
  }

  async getAllBookings() {
    try {
      const response = await api.get('/api/admin/bookings');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch bookings: ${error.response?.status} ${error.response?.data || error.message}`,
        data: [],
      };
    }
  }

  async adminReturnBook(bookingId) {
    try {
      const response = await api.put(`/api/admin/bookings/${bookingId}/return`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to return book',
      };
    }
  }
}

// Create and export a singleton instance
const apiService = new APIService();
export default apiService;
