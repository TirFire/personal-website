import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".codex-next/**", ".next/**", "next-build/**", "node_modules/**", "next-env.d.ts"],
  },
]

export default eslintConfig
