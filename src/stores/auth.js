// stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';

// Helper function to set Axios default header
const setAxiosAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Axios header set with token.');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('Axios header removed.');
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Initialize state from localStorage
    token: localStorage.getItem('access_token') || null,
    // Parse user data safely
    user: (() => {
      const storedUser = localStorage.getItem('user');
      try {
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        localStorage.removeItem('user'); // Clear invalid data
        return null;
      }
    })(),
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Checks if the user is currently authenticated.
     * @returns {boolean} True if a token exists, false otherwise.
     */
    isAuthenticated: (state) => !!state.token,

    /**
     * Gets the name of the logged-in user.
     * @returns {string | null} The user's name or null if not logged in or user data is missing.
     */
    userName: (state) => state.user?.name || null, // Optional chaining

    /**
     * Gets the role of the logged-in user.
     * @returns {string | null} The user's role or null if not logged in or user data is missing.
     */
    userRole: (state) => state.user?.role || null, // Optional chaining
  },

  actions: {
    /**
     * Attempts to log in the user with provided credentials.
     * Updates state, localStorage, and Axios headers on success.
     * @param {object} credentials - { email, password }
     * @returns {Promise<boolean>} True if login was successful, false otherwise.
     */
    async handleLogin(credentials) {
      this.loading = true;
      this.error = null;
      try {
        // Using hardcoded URL as per original code
        const response = await axios.post(
          'http://back-end.test/api/login',
          credentials
        );

        console.log('Login API Response:', response.data);

        // Validate response structure (basic check)
        if (!response.data.access_token || !response.data.user) {
            throw new Error('Invalid login response structure from API.');
        }

        // --- Success ---
        // Store token and user data in Pinia state
        this.token = response.data.access_token;
        this.user = response.data.user;

        // Persist in localStorage
        localStorage.setItem('access_token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        // Set Axios header for subsequent requests
        setAxiosAuthHeader(this.token);

        return true; // Indicate success

      } catch (error) {
        // --- Failure ---
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Login API Error Response:', error.response.data);
          this.error = error.response.data.message || 'Login gagal. Periksa kembali email dan password Anda.';
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Login Network Error:', error.request);
          this.error = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Login Request Setup Error:', error.message);
          this.error = `Terjadi kesalahan: ${error.message || 'Silakan coba lagi.'}`;
        }
        // Clear any potentially inconsistent state
        this.token = null;
        this.user = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setAxiosAuthHeader(null);

        return false; // Indicate failure
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logs out the current user.
     * Clears state, localStorage, and Axios headers.
     */
    logout() {
      console.log('Logging out user...');
      this.token = null;
      this.user = null;
      this.error = null; // Clear any previous errors on logout

      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      setAxiosAuthHeader(null); // Remove auth header
      console.log('Logout complete.');
    },

    /**
     * Clears any existing login error message.
     */
    clearError() {
      this.error = null;
    },

    /**
     * Initializes the Axios header if a token exists upon store creation.
     * Call this once when the application starts or the store is first accessed.
     */
    initializeAuthHeader() {
        if (this.token) {
            console.log('Initializing Axios header from stored token.');
            setAxiosAuthHeader(this.token);
        }
    }
  }
});
