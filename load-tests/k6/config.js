// k6 shared configuration and helpers
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
export const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:5173';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Thresholds used across all test scenarios
export const COMMON_THRESHOLDS = {
  // 95% of requests under 500ms
  http_req_duration: ['p(95)<500', 'p(99)<1500'],
  // Error rate under 1%
  http_req_failed: ['rate<0.01'],
  // 95% of checks pass
  checks: ['rate>0.95'],
};

/**
 * Register a new user and return { email, password, cookies }
 */
export function registerUser(http, suffix) {
  const tag = suffix || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const email = `k6_${tag}@loadtest.invalid`;
  const password = 'loadtest123';

  const res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, name: `K6 User ${tag}`, password }),
    { headers: DEFAULT_HEADERS },
  );

  if (res.status !== 201) {
    console.error(`Registration failed: ${res.status} ${res.body}`);
    return null;
  }

  return { email, password, cookies: res.cookies };
}

/**
 * Login and return cookies jar
 */
export function loginUser(http, email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: DEFAULT_HEADERS },
  );
  if (res.status !== 200) return null;
  return res.cookies;
}

/**
 * Create a project and return its id
 */
export function createProject(http, cookies, name) {
  const res = http.post(
    `${BASE_URL}/projects`,
    JSON.stringify({ name }),
    { headers: DEFAULT_HEADERS, cookies },
  );
  if (res.status !== 201) return null;
  return JSON.parse(res.body).id;
}
