/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",

    extensionsToTreatAsEsm: [".ts", ".tsx"],

    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "tsconfig.test.json",
            },
        ],
    },
};