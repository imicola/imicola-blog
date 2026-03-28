class AdmonitionCollapser {
	constructor() {
		this.processed = new WeakSet();
		this.idCounter = 0;
		this.init();
	}

	init() {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => {
				this.setup();
			});
		} else {
			this.setup();
		}

		document.addEventListener("swup:pageView", () => {
			this.resetAndSetup(100);
		});

		document.addEventListener("swup:contentReplaced", () => {
			this.resetAndSetup(60);
		});

		this.setupSwupHooks();
	}

	setupSwupHooks() {
		if (!window.swup?.hooks) return;

		window.swup.hooks.on("page:view", () => {
			this.resetAndSetup(100);
		});

		window.swup.hooks.on("content:replace", () => {
			this.resetAndSetup(60);
		});
	}

	resetAndSetup(delay = 0) {
		this.processed = new WeakSet();
		setTimeout(() => {
			this.setup();
		}, delay);
	}

	setup() {
		const admonitions = document.querySelectorAll(
			".markdown-content blockquote.admonition.admonition-collapsible",
		);

		admonitions.forEach((admonition) => {
			if (this.processed.has(admonition)) return;
			this.enhance(admonition);
			this.processed.add(admonition);
		});
	}

	enhance(admonition) {
		const title = admonition.querySelector(":scope > .bdm-title");
		if (!title) return;

		title.classList.add("is-collapsible");
		title.setAttribute("role", "button");
		title.setAttribute("tabindex", "0");

		if (!admonition.id) {
			this.idCounter += 1;
			admonition.id = `admonition-${this.idCounter}`;
		}

		title.setAttribute("aria-controls", admonition.id);

		const syncAria = () => {
			const expanded = !admonition.classList.contains("is-collapsed");
			title.setAttribute("aria-expanded", String(expanded));
			admonition.setAttribute(
				"data-collapse-state",
				expanded ? "expanded" : "collapsed",
			);
		};

		const toggle = () => {
			admonition.classList.toggle("is-collapsed");
			syncAria();
		};

		title.addEventListener("click", (event) => {
			if (event.target instanceof HTMLAnchorElement) return;
			event.preventDefault();
			toggle();
		});

		title.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			toggle();
		});

		syncAria();
	}
}

const admonitionCollapser = new AdmonitionCollapser();
window.admonitionCollapser = admonitionCollapser;

export {};
