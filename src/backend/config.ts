import { parse as parseYaml } from "yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { PROJECT_ROOT } from "./constants";
import type { AppConfig, JsonRecord } from "./types";

function asObject(value: unknown): JsonRecord {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
        return {};
    }
    return value as JsonRecord;
}

function deepMerge(base: JsonRecord, overlay: JsonRecord): JsonRecord {
    const merged: JsonRecord = { ...base };

    for (const [key, overlayValue] of Object.entries(overlay)) {
        const baseValue = merged[key];
        if (
            typeof baseValue === "object" &&
            baseValue != null &&
            !Array.isArray(baseValue) &&
            typeof overlayValue === "object" &&
            overlayValue != null &&
            !Array.isArray(overlayValue)
        ) {
            merged[key] = deepMerge(baseValue as JsonRecord, overlayValue as JsonRecord);
        } else {
            merged[key] = overlayValue;
        }
    }

    return merged;
}

function readYamlConfig(filePath: string): JsonRecord {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    try {
        const text = fs.readFileSync(filePath, "utf8");
        const parsed = parseYaml(text);
        return asObject(parsed);
    } catch {
        return {};
    }
}

export function loadConfig(): AppConfig {
    const baseConfigPath = path.join(PROJECT_ROOT, "src", "backend", "application-base.yaml");
    const appConfigPath = path.join(PROJECT_ROOT, "application.yaml");

    const baseConfig = readYamlConfig(baseConfigPath);
    const appConfig = readYamlConfig(appConfigPath);
    const merged = deepMerge(baseConfig, appConfig);

    const server = asObject(merged.server);
    const kanka = asObject(merged.kanka);

    const port =
        Number.parseInt(process.env.PORT ?? "", 10) ||
        (typeof server.port === "number" ? server.port : 8080);

    const cacheDelay =
        Number.parseInt(process.env.KANKA_CACHE_DELAY ?? "", 10) ||
        (typeof kanka.cache_delay === "number" ? kanka.cache_delay : 60);

    const configuredApiKey =
        process.env.KANKA_API_KEY ??
        (typeof kanka.api_key === "string" ? kanka.api_key : null);

    return {
        port,
        kankaApiKey: configuredApiKey,
        kankaCacheDelaySec: cacheDelay,
    };
}
