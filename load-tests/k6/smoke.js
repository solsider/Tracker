/**
 * smoke.js — minimal sanity check: 1 VU, 30s, all critical paths
 * Run: k6 run load-tests/k6/smoke.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, DEFAULT_HEADERS, COMMON_THRESHOLDS, registerUser, createProject } from './config.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: COMMON_THRESHOLDS,
};

export default function () {
  // Health
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // Register
  const user = registerUser(http, `smoke_${__VU}_${__ITER}`);
  if (!user) return;

  // Create project
  const projectId = createProject(http, user.cookies, `Smoke Project ${Date.now()}`);
  check({ projectId }, { 'project created': (r) => r.projectId !== null });

  if (!projectId) return;

  // Create issue
  const issueRes = http.post(
    `${BASE_URL}/projects/${projectId}/issues`,
    JSON.stringify({ title: `Smoke Issue ${__ITER}`, priority: 'MEDIUM' }),
    { headers: DEFAULT_HEADERS, cookies: user.cookies },
  );
  check(issueRes, { 'issue created': (r) => r.status === 201 });

  // Get issues
  const listRes = http.get(
    `${BASE_URL}/projects/${projectId}/issues`,
    { cookies: user.cookies },
  );
  check(listRes, { 'issues listed': (r) => r.status === 200 });

  // Logout
  const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, { cookies: user.cookies });
  check(logoutRes, { 'logout ok': (r) => r.status === 200 });

  sleep(1);
}
