/**
 * stress.js — find the breaking point: ramp to 200 VUs
 * Run: k6 run load-tests/k6/stress.js
 * Watch for: error rate spike, p99 latency explosion, 429 throttle responses
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, COMMON_THRESHOLDS, registerUser, createProject } from './config.js';

const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 200 },  // hold at peak
    { duration: '3m', target: 0 },
  ],
  // Stress test — relax thresholds; we observe, not enforce
  thresholds: {
    http_req_duration: ['p(99)<5000'],
    error_rate: ['rate<0.10'],
  },
};

const userCache = {};

export default function () {
  if (!userCache[__VU]) {
    userCache[__VU] = registerUser(http, `stress_${__VU}_${Date.now()}`);
  }
  const user = userCache[__VU];
  if (!user) { sleep(1); return; }

  // Simulate concurrent kanban usage
  const projectId = createProject(http, user.cookies, `Stress ${__VU}_${__ITER}`);
  if (!projectId) { errorRate.add(1); return; }

  const issueRes = http.post(
    `${BASE_URL}/projects/${projectId}/issues`,
    JSON.stringify({ title: `Stress Issue ${__ITER}`, priority: 'HIGH' }),
    { headers: DEFAULT_HEADERS, cookies: user.cookies },
  );
  const ok = check(issueRes, { '201 or 429': (r) => r.status === 201 || r.status === 429 });
  errorRate.add(!ok);

  sleep(0.5);
}
