import { createBrandIcon } from "./_brand-icon";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return createBrandIcon(32, 6, 20);
}
