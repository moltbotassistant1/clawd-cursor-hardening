import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // Exclude platform-specific files and interactive CLI files
      // that require a real OS/display or interactive TTY to test
      exclude: [
        "src/accessibility.ts", // OS accessibility bridge (requires real display)
        "src/native-desktop.ts", // Native screen capture/control (requires real display)
        "src/doctor.ts", // Interactive CLI diagnosis (mostly I/O, TTY required)
        "node_modules/**",
        "dist/**",
      ],
      thresholds: {
        statements: 50,
      },
    },
  },
});
