/** Configuration Jest — tests unitaires Sprint 1 (TypeScript via ts-jest). */
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true, types: ['jest', 'node'] } }],
  },
};
