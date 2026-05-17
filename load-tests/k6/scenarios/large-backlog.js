/**
 * large-backlog.js — stress test with large data sets
 * Creates projects with 100+ issues and measures list/filter performance
 * Run: k6 run load-tests/k6/scenarios/large-backlog.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, COMMON_THRESHOLDS, registerUser, createProject } from '../config.js';

const backlogListDuration = new Trend('backlog_list_100_issues');

export const options = {
  vus: 5,
  iterations: 5,   // 5 VUs × 5 iters = 25 large-project scenarios
  thresholds: {
    backlog_list_100_issues: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const user = registerUser(http, `backlog_${__VU}_${Date.now()}`);
  if (!user) return;

  const projectId = createProject(http, user.cookies, `Large Backlog ${__VU}`);
  if (!projectId) return;

  // Create 100 issues in batches of 10
  group('bulk create 100 issues', () => {
    for (let i = 0; i < 100; i++) {
      const res = http.post(
        `${BASE_URL}/projects/${projectId}/issues`,
        JSON.stringify({
          title: `Backlog Issue ${i}`,
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
          description: `Auto-generated issue ${i} for load testing`,
        }),
        { headers: DEFAULT_HEADERS, cookies: user.cookies },
      );
      check(res, { 'issue created': (r) => r.status === 201 });
      if (i % 10 === 9) sleep(0.1); // brief pause every 10
    }
  });

  // Now measure list performance with 100+ issues
  group('list large backlog', () => {
    const start = Date.now();
    const listRes = http.get(
      `${BASE_URL}/projects/${projectId}/issues?limit=50&page=1`,
      { cookies: user.cookies },
    );
    backlogListDuration.add(Date.now() - start);
    check(listRes, {
      'list 200': (r) => r.status === 200,
      'returns items': (r) => {
        try { return JSON.parse(r.body).length > 0; } catch { return false; }
      },
    });
  });

  group('second page', () => {
    const start = Date.now();
    const page2 = http.get(
      `${BASE_URL}/projects/${projectId}/issues?limit=50&page=2`,
      { cookies: user.cookies },
    );
    backlogListDuration.add(Date.now() - start);
    check(page2, { 'page 2 ok': (r) => r.status === 200 });
  });

  sleep(2);
}
