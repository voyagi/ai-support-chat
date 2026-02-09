import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/widget-loader/index.ts",
	output: {
		file: "public/widget.js",
		format: "iife",
		name: "AIChat",
		sourcemap: false,
	},
	plugins: [
		typescript({
			tsconfig: false,
			include: ["src/widget-loader/**/*.ts"],
			compilerOptions: {
				target: "ES2020",
				module: "ESNext",
				moduleResolution: "bundler",
				strict: true,
				lib: ["ES2020", "DOM"],
				skipLibCheck: true,
			},
		}),
		terser({
			mangle: { toplevel: true },
			compress: { drop_console: false, passes: 2 },
		}),
	],
};
