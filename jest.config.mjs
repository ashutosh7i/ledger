export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ["./src/tests"],
    transform: { '^.+\\.tsx?$': 'ts-jest' },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    maxWorkers: 1
};