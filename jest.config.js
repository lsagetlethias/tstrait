// @ts-check
/** @type Partial<jest.DefaultOptions> & { [K: string]: any } */
const config = {
    globals: {
        'ts-jest': {
            tsConfig: '<rootDir>/tsconfig.json',
        },
    },
    preset: 'ts-jest',
    transform: {
        '.ts': 'ts-jest',
    },
    collectCoverageFrom: ['trait.ts'],
    coverageReporters: ['json-summary', 'lcov', 'text-summary'],
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['<rootDir>/trait.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};

module.exports = config;
