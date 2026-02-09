(function () {
	"use strict";

	// Extract configuration from script tag data attributes
	const currentScript = document.currentScript as HTMLScriptElement | null;

	const getConfig = () => {
		// Get widget URL from data attribute or infer from script src
		let widgetUrl = currentScript?.getAttribute("data-widget-url") || "";
		if (!widgetUrl && currentScript?.src) {
			// Infer from script src by removing /widget.js
			const scriptUrl = new URL(currentScript.src);
			widgetUrl = `${scriptUrl.protocol}//${scriptUrl.host}`;
		}
		if (!widgetUrl) {
			widgetUrl = window.location.origin; // Fallback to current origin
		}

		const theme = currentScript?.getAttribute("data-theme") || "light";
		const position = currentScript?.getAttribute("data-position") || "bottom-right";

		return { widgetUrl, theme, position };
	};

	const config = getConfig();
	let isOpen = false;
	let currentTheme = config.theme as "light" | "dark";

	// SVG icons
	const chatIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
	const closeIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

	// Create bubble button
	const bubble = document.createElement("div");
	bubble.id = "ai-chat-widget-bubble";
	bubble.innerHTML = chatIcon;

	const bubbleStyles: Partial<CSSStyleDeclaration> = {
		position: "fixed",
		bottom: "20px",
		right: "20px",
		width: "60px",
		height: "60px",
		borderRadius: "50%",
		backgroundColor: "#2563eb",
		color: "white",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
		zIndex: "999999",
		transition: "transform 0.2s ease",
		border: "none",
		outline: "none",
	};
	Object.assign(bubble.style, bubbleStyles);

	// Hover effect
	bubble.addEventListener("mouseenter", () => {
		bubble.style.transform = "scale(1.1)";
	});
	bubble.addEventListener("mouseleave", () => {
		bubble.style.transform = "scale(1)";
	});

	// Create iframe container
	const container = document.createElement("div");
	container.id = "ai-chat-widget-container";

	const containerStyles: Partial<CSSStyleDeclaration> = {
		position: "fixed",
		display: "none",
		overflow: "hidden",
		backgroundColor: "#ffffff",
		zIndex: "999998",
	};
	Object.assign(container.style, containerStyles);

	// Create iframe
	const iframe = document.createElement("iframe");
	iframe.id = "ai-chat-widget-iframe";
	iframe.src = `${config.widgetUrl}/widget`;
	iframe.title = "Chat Widget";
	iframe.allow = "clipboard-write";

	const iframeStyles: Partial<CSSStyleDeclaration> = {
		width: "100%",
		height: "100%",
		border: "none",
	};
	Object.assign(iframe.style, iframeStyles);

	container.appendChild(iframe);

	// Responsive layout logic
	const updateLayout = () => {
		const isMobile = window.innerWidth < 768;

		if (isMobile) {
			// Fullscreen mobile layout
			Object.assign(container.style, {
				top: "0",
				left: "0",
				right: "0",
				bottom: "0",
				width: "100%",
				height: "100%",
				borderRadius: "0",
				boxShadow: "none",
				paddingTop: "env(safe-area-inset-top)",
				paddingBottom: "env(safe-area-inset-bottom)",
			});

			// Hide bubble when widget is open on mobile
			if (isOpen) {
				bubble.style.display = "none";
			}
		} else {
			// Windowed desktop layout
			Object.assign(container.style, {
				bottom: "90px",
				right: "20px",
				top: "auto",
				left: "auto",
				width: "400px",
				height: "600px",
				maxWidth: "calc(100vw - 40px)",
				maxHeight: "calc(100vh - 110px)",
				borderRadius: "12px",
				boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
				paddingTop: "0",
				paddingBottom: "0",
			});

			// Show bubble on desktop
			bubble.style.display = "flex";
		}
	};

	// Toggle widget visibility
	const toggleWidget = () => {
		isOpen = !isOpen;

		if (isOpen) {
			container.style.display = "block";
			bubble.innerHTML = closeIcon;
			updateLayout();
		} else {
			container.style.display = "none";
			bubble.innerHTML = chatIcon;
			bubble.style.display = "flex"; // Restore bubble visibility on close
		}
	};

	bubble.addEventListener("click", toggleWidget);

	// PostMessage bridge - listen for messages from iframe
	window.addEventListener("message", (event: MessageEvent) => {
		// Origin validation - check event origin starts with widget URL
		if (!event.origin.startsWith(config.widgetUrl)) {
			return; // Ignore messages from other origins
		}

		const { type, data } = event.data;

		if (type === "WIDGET_READY") {
			console.log("Widget loaded");
			// Send initial theme to iframe
			iframe.contentWindow?.postMessage(
				{
					type: "THEME_UPDATE",
					theme: currentTheme,
				},
				config.widgetUrl,
			);
		}

		// RESIZE event - store for potential future use
		if (type === "RESIZE" && data?.height) {
			// Could be used for dynamic height adjustment
			// Currently container has fixed dimensions
		}
	});

	// Update layout on resize and orientation change
	window.addEventListener("resize", updateLayout);
	window.addEventListener("orientationchange", updateLayout);

	// Mount to DOM
	const mount = () => {
		if (document.body) {
			document.body.appendChild(bubble);
			document.body.appendChild(container);
			updateLayout();
		} else {
			// Retry if body not ready
			setTimeout(mount, 100);
		}
	};

	// Execute mount when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", mount);
	} else {
		mount();
	}
})();
