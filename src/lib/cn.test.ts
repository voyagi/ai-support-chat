import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
	it("returns empty string for no arguments", () => {
		expect(cn()).toBe("");
	});

	it("passes through a single class", () => {
		expect(cn("text-red-500")).toBe("text-red-500");
	});

	it("merges multiple class strings", () => {
		expect(cn("px-4", "py-2")).toBe("px-4 py-2");
	});

	it("handles conditional classes via clsx", () => {
		expect(cn("base", false && "hidden", "visible")).toBe("base visible");
	});

	it("resolves Tailwind conflicts (last wins)", () => {
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("handles undefined and null inputs", () => {
		expect(cn(undefined, null, "block")).toBe("block");
	});
});
