/**
 * notification-burst.js — simulate burst of activity triggering many notifications
 * Tests notification pagination and read/unread performance under load
 * Run: k6 run load-tests/k6/scenarios/notification-burst.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, registerUser, createProject } from '../config.js';

const notifListDuration = new Trend('notification_list_duration');

export const options = {
  vus: 10,
  duration: '3m',
  thresholds: {
    notification_list_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const user = registerUser(http, `notif_${__VU}_${Date.now()}`);
  if (!user) return;

  const projectId = createProject(http, user.cookies, `Notif Project ${__VU}`);
  if (!projectId) return;

  // Create 20 issues rapidly to generate notification events
  group('generate notifications', () => {
    for (let i = 0; i < 20; i++) {
      http.post(
        `${BASE_URL}/projects/${projectId}/issues`,
        JSON.stringify({ title: `Notif Issue ${__VU}_${__ITER}_${i}`, priority: 'MEDIUM' }),
        { headers: DEFAULT_HEADERS, cookies: user.cookies },
      );
    }
  });

  // Fetch notifications
  group('list notifications', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/notifications?limit=50`,
      { cookies: user.cookies },
    );
    notifListDuration.add(Date.now() - start);
    check(res, { 'notifications 200': (r) => r.status === 200 });
  });

  // Mark all as read
  group('mark all read', () => {
    const res = http.post(
      `${BASE_URL}/notifications/read-all`,
      null,
      { cookies: user.cookies },
    );
    check(res, { 'mark read ok': (r) => r.status === 200 || r.status === 204 });
  });

  sleep(1);
}
