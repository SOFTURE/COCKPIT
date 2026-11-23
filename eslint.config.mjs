import nextVitals from "eslint-config-next/core-web-vitals";
import { createSoftureEslintConfig } from "@softure-ai/config/eslint";

export default createSoftureEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  extends: [...nextVitals],
  ignores: [".data/**", "test-results/**", ".claude/**"],
});
