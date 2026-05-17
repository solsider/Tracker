/**
 * websocket.js — WebSocket / Socket.io load test
 * Simulates concurrent realtime connections with room subscriptions
 * Run: k6 run load-tests/k6/scenarios/websocket.js
 * Note: k6 WebSocket uses the native ws:// protocol; socket.io polling fallback tested via HTTP
 */
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { BASE_URL, DEFAULT_HEADERS, registerUser, createProject } from '../config.js';

const wsConnects = new Counter('ws_connects');
const wsErrors = new Counter('ws_errors');
const WS_URL = (BASE_URL.replace('http', 'ws')) + '/realtime';

export const options = {
  scenarios: {
    websocket_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    ws_errors: ['count<10'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // First get auth cookie via HTTP login
  const user = registerUser(http, `ws_${__VU}_${Date.now()}`);
  if (!user) { wsErrors.add(1); return; }

  const projectId = createProject(http, user.cookies, `WS Project ${__VU}`);
  if (!projectId) { wsErrors.add(1); return; }

  // Build cookie string for WS handshake
  const cookieStr = Object.entries(user.cookies)
    .map(([k, v]) => `${k}=${v[0].value}`)
    .join('; ');

  const res = ws.connect(
    WS_URL,
    { headers: { Cookie: cookieStr } },
    function (socket) {
      wsConnects.add(1);

      socket.on('open', () => {
        // Join project room
        socket.send(JSON.stringify({ event: 'join-project', data: { projectId } }));
      });

      socket.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          check(msg, { 'valid ws message': (m) => m.event !== undefined || m.type !== undefined });
        } catch { /* ignore non-JSON */ }
      });

      socket.on('error', () => wsErrors.add(1));

      // Stay connected for a realistic duration
      sleep(10 + Math.random() * 10);

      socket.send(JSON.stringify({ event: 'leave-project', data: { projectId } }));
      socket.close();
    },
  );

  check(res, { 'ws connected': (r) => r && r.status === 101 });
  sleep(1);
}
