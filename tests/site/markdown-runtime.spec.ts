import type { Page, Request } from "@playwright/test";
import { expect, test } from "@playwright/test";

const PLAIN_POST_PATH = "/posts/admonitions/";
const RICH_POST_PATH = "/posts/mdx-showcase/";
const IMAGE_GRID_POST_PATH = "/posts/image-grid-demo/";
const CODE_POST_PATH = "/posts/expressive-code/";

const optionalRuntimeModules = {
	fancybox: /\/src\/utils\/fancybox-handler\.ts(?:\?|$)/,
	codeCollapse: /\/src\/utils\/code-collapse\.ts(?:\?|$)/,
	katex: /\/src\/utils\/katex-scroll\.ts(?:\?|$)/,
	mermaid: /\/src\/utils\/mermaid\.ts(?:\?|$)/,
	mermaidStyles: /\/src\/styles\/mermaid\.css(?:\?|$)/,
};

function trackOptionalRuntimeRequests(page: Page): string[] {
	const requests: string[] = [];
	page.on("request", (request: Request) => {
		const url = request.url();
		if (
			Object.values(optionalRuntimeModules).some((pattern) => pattern.test(url))
		) {
			requests.push(url);
		}
	});
	return requests;
}

function hasRequestFor(
	requests: string[],
	modules: Array<RegExp>,
): boolean {
	return requests.some((url) => modules.some((pattern) => pattern.test(url)));
}

test.describe("Markdown syntax runtime loading", () => {
	test("defers math and Mermaid assets until a Swup target uses them", async ({
		page,
	}) => {
		const requests = trackOptionalRuntimeRequests(page);

		await page.goto(PLAIN_POST_PATH, { waitUntil: "networkidle" });
		await page.waitForFunction(() => Boolean(window.swup?.navigate));
		expect(
			hasRequestFor(requests, [
				optionalRuntimeModules.katex,
				optionalRuntimeModules.mermaid,
				optionalRuntimeModules.mermaidStyles,
			]),
		).toBe(false);

		await page.evaluate((path) => window.swup?.navigate(path), RICH_POST_PATH);
		await page.waitForURL(`**${RICH_POST_PATH}`);
		await expect(page.locator(".markdown-mermaid").first()).toHaveAttribute(
			"data-mermaid-state",
			"ready",
			{ timeout: 15_000 },
		);
		const formula = page.locator(".katex-display").first();
		await formula.scrollIntoViewIfNeeded();
		await expect(formula).toHaveAttribute(
			"data-scrollbar-initialized",
			"true",
			{ timeout: 15_000 },
		);

		expect(
			requests.some((url) => optionalRuntimeModules.mermaid.test(url)),
		).toBe(true);
		expect(
			requests.some((url) => optionalRuntimeModules.mermaidStyles.test(url)),
		).toBe(true);
		expect(requests.some((url) => optionalRuntimeModules.katex.test(url))).toBe(
			true,
		);
	});

	test("defers Fancybox until a Swup target contains a lightbox", async ({
		page,
	}) => {
		const requests = trackOptionalRuntimeRequests(page);

		await page.goto(PLAIN_POST_PATH, { waitUntil: "networkidle" });
		await page.waitForFunction(() => Boolean(window.swup?.navigate));
		expect(
			hasRequestFor(requests, [optionalRuntimeModules.fancybox]),
		).toBe(false);

		await page.evaluate(
			(path) => window.swup?.navigate(path),
			IMAGE_GRID_POST_PATH,
		);
		await page.waitForURL(`**${IMAGE_GRID_POST_PATH}`);
		await expect(page.locator("html")).toHaveAttribute(
			"data-fancybox-ready",
			"true",
			{ timeout: 15_000 },
		);

		expect(
			requests.some((url) => optionalRuntimeModules.fancybox.test(url)),
		).toBe(true);
	});

	test("loads code-collapse only for Markdown content with code blocks", async ({
		page,
	}) => {
		const requests = trackOptionalRuntimeRequests(page);

		await page.goto("/", { waitUntil: "networkidle" });
		await page.waitForFunction(() => Boolean(window.swup?.navigate));
		expect(
			requests.some((url) => optionalRuntimeModules.codeCollapse.test(url)),
		).toBe(false);

		await page.evaluate((path) => window.swup?.navigate(path), CODE_POST_PATH);
		await page.waitForURL(`**${CODE_POST_PATH}`);
		const toggle = page.locator(".collapse-toggle-btn").first();
		await expect(toggle).toBeVisible();
		await expect(toggle).toHaveAttribute("aria-label", "Expand code block");

		expect(
			requests.some((url) => optionalRuntimeModules.codeCollapse.test(url)),
		).toBe(true);
	});
});
