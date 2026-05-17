import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/types/**',
      ],
      thresholds: {
        'src/store/auth.store.ts': { lines: 100, functions: 100 },
        'src/store/drawer.store.ts': { lines: 100, functions: 100 },
        'src/hooks/useSprints.ts': { lines: 80 },
        'src/hooks/useIssues.ts': { lines: 60 },
        'src/pages/auth/LoginPage.tsx': { lines: 85 },
        'src/components/ui/Modal.tsx': { lines: 95 },
        'src/components/ui/Input.tsx': { lines: 95 },
        'src/components/backlog/BacklogIssueRow.tsx': { lines: 95 },
      },
    },
  },
});
