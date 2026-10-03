module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
  },
};
