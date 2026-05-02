const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  displayName: 'mode-basic',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
};
