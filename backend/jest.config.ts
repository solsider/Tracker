import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.dto.ts',
    '!src/prisma/**',
    '!src/**/strategies/**',
    '!src/**/guards/**',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  testEnvironment: 'node',
  coverageThreshold: {
    global: {},
    './src/auth/auth.service.ts': { lines: 100, functions: 100 },
    './src/sprints/sprints.service.ts': { lines: 95, functions: 95 },
    './src/issues/issues.service.ts': { lines: 85, functions: 85 },
  },
};

export default config;
