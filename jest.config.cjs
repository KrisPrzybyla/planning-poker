module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/backend', '<rootDir>/tests/integration'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
    // Plain .js sources (server.js, roomStore.js, logger.js) are authored as
    // real ESM ("type": "module" in package.json). babel.config.cjs compiles
    // their import/export to CommonJS so the backend tests can import the
    // actual server code under Jest's classic runtime, instead of testing a
    // second, hand-rolled copy of the server logic.
    '^.+\\.js$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};