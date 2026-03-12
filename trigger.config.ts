import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
    project: "notify-warden", // Replace with your actual project ID from Trigger.dev dashboard
    logLevel: "log",
    retries: {
        enabled: true,
        default: {
            maxAttempts: 3,
            minTimeoutInMs: 1000,
            maxTimeoutInMs: 30000,
            factor: 2,
            randomize: true,
        },
    },
};
