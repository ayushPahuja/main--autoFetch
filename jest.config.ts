  // jest.config.ts
import type {Config} from "@jest/types";

const config: Config.InitialOptions = {
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    testEnvironment: "node",
    rootDir: "src",
    roots: ["<rootDir>/test"],
    testRegex: ".spec.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    modulePaths: ["<rootDir>/modules/*"],
    moduleNameMapper: {
        '^@src/(.*)': '<rootDir>/$1',
        '^@modules/(.*)': '<rootDir>/modules/$1',
        '^axios$': require.resolve('axios'),
    },
    testSequencer: "<rootDir>/test/testSequencer.js"
    // transformIgnorePatterns: [
    //     '<rootDir>/node_modules/',
    // ],
    // moduleNameMapper: {
    //     "^@modules(.*)$": "<rootDir>/modules$1"
    // },
    // coverageDirectory: "../coverage",
    // transformIgnorePatterns: [
    //     "node_modules/$1"
    // ]
};

export default config;

// ,
//   "jest": {
//     "moduleFileExtensions": [
//       "js",
//       "json",
//       "ts"
//     ],
//     "rootDir": "src",
//     "testRegex": ".spec.ts$",
//     "transform": {
//       "^.+\\.(t|j)s$": "ts-jest"
//     },
//     "coverageDirectory": "../coverage",
//     "testEnvironment": "node",
//     "modulePaths": ["<rootDir>/modules/"]
//   }
