import { describe, expect, it, vi } from "vitest";

// Mock Redis before importing the module (top-level Redis.fromEnv() call).
// Only stubs the import so synchronous helpers can be tested.
// Async Redis operations (getCurrentCost, trackChatCost, checkBudgetRemaining)
// are NOT covered here and need a real or extended mock.
vi.mock("@upstash/redis", () => ({
	Redis: {
		fromEnv: () => ({}),
	},
}));

import {
	ALERT_THRESHOLDS,
	checkCostAlerts,
	DAILY_BUDGET,
} from "./cost-tracking";

describe("checkCostAlerts", () => {
	it("returns 'ok' for cost $0", () => {
		const result = checkCostAlerts(0);
		expect(result.level).toBe("ok");
		expect(result.message).toContain("normal");
	});

	it("returns 'ok' for cost just under warning threshold", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.warning.amount - 0.01);
		expect(result.level).toBe("ok");
	});

	it("returns 'warning' at exactly the warning threshold", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.warning.amount);
		expect(result.level).toBe("warning");
		expect(result.message).toContain("50%");
	});

	it("returns 'warning' between warning and critical", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.critical.amount - 0.01);
		expect(result.level).toBe("warning");
	});

	it("returns 'critical' at exactly the critical threshold", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.critical.amount);
		expect(result.level).toBe("critical");
		expect(result.message).toContain("80%");
	});

	it("returns 'critical' between critical and shutoff", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.shutoff.amount - 0.01);
		expect(result.level).toBe("critical");
	});

	it("returns 'shutoff' at exactly the shutoff threshold", () => {
		const result = checkCostAlerts(ALERT_THRESHOLDS.shutoff.amount);
		expect(result.level).toBe("shutoff");
		expect(result.message).toContain("exceeded");
	});

	it("returns 'shutoff' above budget", () => {
		const result = checkCostAlerts(DAILY_BUDGET + 5);
		expect(result.level).toBe("shutoff");
	});
});
