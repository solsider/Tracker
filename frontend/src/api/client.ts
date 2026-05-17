import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
});

// Silent token refresh — retry queue pattern
let isRefreshing = false;
type QueueEntry = { resolve: () => void; reject: (e: unknown) => void };
let failedQueue: QueueEntry[] = [];

function flushQueue(error?: unknown) {
  failedQueue.forEach((entry) => (error ? entry.reject(error) : entry.resolve()));
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status;

    // Don't intercept refresh or login endpoints to avoid loops
    const isAuthEndpoint =
      original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login');

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => client(original));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        flushQueue();
        return client(original);
      } catch (refreshError) {
        flushQueue(refreshError);
        // Refresh failed — clear persisted auth state and send to login
        try { localStorage.removeItem('auth-storage'); } catch { /* private browsing */ }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;
