/**
 * load.js — realistic concurrent load: ramp to 50 VUs over 5min, hold 10min, ramp down
 * Simulates: multi-user kanban, issue CRUD, project browsing
 * Run: k6 run load-tests/k6/load.js
 * Run with custom URL: k6 run --env BASE_URL=https://staging.tracker.app load-tests/k6/load.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, COMMON_THRESHOLDS, registerUser, createProject } from './config.js';

const issueCreateDuration = new Trend('issue_create_duration');
const projectListDuration = new Trend('project_list_duration');
const authErrors = new Counter('auth_errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // warm up
    { duration: '3m', target: 30 },   // ramp
    { duration: '5m', target: 50 },   // peak load
    { duration: '2m', target: 50 },   // sustain
    { duration: '3m', target: 0 },    // ramp down
  ],
  thresholds: {
    ...COMMON_THRESHOLDS,
    issue_create_duration: ['p(95)<800'],
    project_list_duration: ['p(95)<300'],
  },
};

// One user per VU — setup on first iteration
const userCache = {};

function getUser() {
  if (userCache[__VU]) return userCache[__VU];
  const user = registerUser(http, `load_${__VU}_${Date.now()}`);
  if (!user) { authErrors.add(1); return null; }
  userCache[__VU] = user;
  return user;
}

export default function () {
  const user = getUser();
  if (!user) { sleep(1); return; }

  group('project list', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/projects`, { cookies: user.cookies });
    projectListDuration.add(Date.now() - start);
    check(res, { 'projects 200': (r) => r.status === 200 });
  });

  group('create and browse project', () => {
    const projectId = createProject(http, user.cookies, `Load P ${__VU}_${__ITER}`);
    if (!projectId) return;

    // Create 3 issues
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const res = http.post(
        `${BASE_URL}/projects/${projectId}/issues`,
        JSON.stringify({ title: `Issue ${i} VU${__VU} iter${__ITER}`, priority: 'MEDIUM' }),
        { headers: DEFAULT_HEADERS, cookies: user.cookies },
      );
      issueCreateDuration.add(Date.now() - start);
      check(res, { 'issue created': (r) => r.status === 201 });
      sleep(0.2);
    }

    // List issues
    const listRes = http.get(
      `${BASE_URL}/projects/${projectId}/issues`,
      { cookies: user.cookies },
    );
    check(listRes, { 'issues list 200': (r) => r.status === 200 });

    // Get columns
    const colRes = http.get(
      `${BASE_URL}/projects/${projectId}/columns`,
      { cookies: user.cookies },
    );
    check(colRes, { 'columns 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 1);
}
