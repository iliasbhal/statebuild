module.exports = {
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: [
    // 'build',
  ],
  
  coveragePathIgnorePatterns: [
    'src/index.ts',
    'src/hooks/index.ts',
    'src/models/index.ts',
    '.d.ts$',
  ],
};
