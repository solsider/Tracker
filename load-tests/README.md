# Load Tests (k6)

Performance and load testing suite using [k6](https://k6.io).

## Prerequisites

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (scoop)
scoop install k6
```

## Running Tests

All tests require a running backend. Start it with `npm run dev` from the repo root.

```bash
# Smoke test (30s, 1 user — CI sanity check)
k6 run load-tests/k6/smoke.js

# Load test (15min ramp to 50 VUs)
k6 run load-tests/k6/load.js

# Stress test (find breaking point — 200 VUs)
k6 run load-tests/k6/stress.js

# WebSocket concurrent connections
k6 run load-tests/k6/scenarios/websocket.js

# Large backlog performance
k6 run load-tests/k6/scenarios/large-backlog.js

# Notification burst
k6 run load-tests/k6/scenarios/notification-burst.js
```

### Custom target URL

```bash
k6 run --env BASE_URL=https://staging.tracker.app load-tests/k6/load.js
```

### Output to JSON for analysis

```bash
k6 run --out json=results/load-$(date +%Y%m%d).json load-tests/k6/load.js
```

## Thresholds

Tests fail (non-zero exit) if:
- `p(95)` of all requests exceeds **500ms**
- `p(99)` exceeds **1500ms**
- Error rate exceeds **1%**
- Check pass rate drops below **95%**

The stress test uses relaxed thresholds — it's for observation, not gating.

## Baseline Results (target)

| Scenario | VUs | p95 | p99 | Error Rate |
|----------|-----|-----|-----|------------|
| Smoke | 1 | <100ms | <200ms | 0% |
| Load | 50 | <500ms | <1s | <1% |
| Backlog 100 issues | 5 | <1s | <2s | <2% |
| Notifications burst | 10 | <300ms | <600ms | <2% |
