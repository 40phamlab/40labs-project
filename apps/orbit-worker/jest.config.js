module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^react-native-vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
  },
};
