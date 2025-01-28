module.exports = {
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: [
    './build',
  ],
  coveragePathIgnorePatterns: [
    '.d.ts$',
  ],
};
