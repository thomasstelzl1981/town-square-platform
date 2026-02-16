import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      
      // Zone boundary enforcement (ZBC-R04)
      // Prevents cross-zone imports that violate architectural boundaries
      "no-restricted-imports": ["warn", {
        "patterns": [
          {
            "group": ["**/pages/admin/**"],
            "message": "Zone 1 (admin) imports should not be used outside admin pages. Use shared components instead."
          },
          {
            "group": ["**/pages/portal/**"],
            "message": "Zone 2 (portal) imports should not be used outside portal pages. Use shared components instead."
          },
          {
            "group": ["**/pages/zone3/**"],
            "message": "Zone 3 (website) imports should not be used outside zone3 pages. Use shared components instead."
          }
        ]
      }],
    },
  },
  // Additional rule for zone-specific files
  {
    files: ["src/pages/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/pages/portal/**"],
            "message": "Zone 1 (admin) cannot import from Zone 2 (portal). Extract shared logic to src/shared/"
          },
          {
            "group": ["**/pages/zone3/**"],
            "message": "Zone 1 (admin) cannot import from Zone 3 (website). Extract shared logic to src/shared/"
          }
        ]
      }]
    }
  },
  {
    files: ["src/pages/portal/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/pages/admin/**"],
            "message": "Zone 2 (portal) cannot import from Zone 1 (admin). Extract shared logic to src/shared/"
          },
          {
            "group": ["**/pages/zone3/**"],
            "message": "Zone 2 (portal) cannot import from Zone 3 (website). Extract shared logic to src/shared/"
          }
        ]
      }]
    }
  },
  {
    files: ["src/pages/zone3/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/pages/admin/**"],
            "message": "Zone 3 (website) cannot import from Zone 1 (admin). Extract shared logic to src/shared/"
          },
          {
            "group": ["**/pages/portal/**"],
            "message": "Zone 3 (website) cannot import from Zone 2 (portal). Extract shared logic to src/shared/"
          }
        ]
      }]
    }
  }
);
