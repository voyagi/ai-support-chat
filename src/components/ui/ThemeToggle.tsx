"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const { theme, setTheme } = useTheme();
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	if (!mounted) {
		return null;
	}

	const getCurrentIcon = () => {
		switch (theme) {
			case "light":
				return <Sun className="h-5 w-5" />;
			case "dark":
				return <Moon className="h-5 w-5" />;
			default:
				return <Monitor className="h-5 w-5" />;
		}
	};

	const options = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	] as const;

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400"
				aria-label="Toggle theme"
			>
				{getCurrentIcon()}
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
					{options.map((option) => {
						const Icon = option.icon;
						const isActive = theme === option.value;

						return (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									setTheme(option.value);
									setIsOpen(false);
								}}
								className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
									isActive ? "bg-gray-100 dark:bg-gray-700" : ""
								}`}
							>
								<Icon className="h-4 w-4" />
								<span className="text-sm">{option.label}</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
