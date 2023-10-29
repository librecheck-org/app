module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        "plugin:vue/vue3-essential",
        "eslint:recommended",
        "@vue/typescript/recommended"
    ],
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
        "vue/no-deprecated-slot-attribute": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "semi": ["error", "always"],
        "quotes": ["error", "double", { "avoidEscape": true }],
        "sort-imports": ["warn", { "allowSeparatedGroups": true }]
    },
    ignorePatterns: [
        "dist/**/*"
    ]
};
