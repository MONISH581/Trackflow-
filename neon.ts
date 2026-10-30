import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: false,
  branch: (branch) => {
    if (branch.isDefault) {
      return {
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25, // scale to zero when idle
            autoscalingLimitMaxCu: 1,
            suspendTimeout: "5m",
          },
        },
      };
    }
    if (!branch.exists) {
      return {
        ttl: "7d", // ephemeral branches auto-expire instead of accruing storage
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: "5m",
          },
        },
      };
    }
    return {};
  },
});
