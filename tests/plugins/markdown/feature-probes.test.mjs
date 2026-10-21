import assert from "node:assert/strict";
import { test } from "node:test";

import { siteMarkdownProcessor } from "../../../src/utils/markdown-processor.mjs";

const renderer = await siteMarkdownProcessor.createRenderer({});

test("records math and Mermaid capabilities in render frontmatter", async () => {
	const math = await renderer.render("Euler: $e^{i\\pi}+1=0$");
	assert.equal(math.metadata.frontmatter.hasMath, true);
	assert.equal(math.metadata.frontmatter.hasMermaid, false);
	assert.deepEqual(math.metadata.frontmatter.markdownFeatures, {
		math: true,
		mermaid: false,
		codeInteractions: false,
	});

	const mermaid = await renderer.render(
		"```mermaid\nflowchart LR\n  A --> B\n```",
	);
	assert.equal(mermaid.metadata.frontmatter.hasMath, false);
	assert.equal(mermaid.metadata.frontmatter.hasMermaid, true);
	assert.deepEqual(mermaid.metadata.frontmatter.markdownFeatures, {
		math: false,
		mermaid: true,
		codeInteractions: false,
	});
});

test("does not mark ordinary prose with optional capabilities", async () => {
	const result = await renderer.render("A plain article with no extensions.");
	assert.deepEqual(
		{
			markdownFeatures: result.metadata.frontmatter.markdownFeatures,
			hasMath: result.metadata.frontmatter.hasMath,
			hasMermaid: result.metadata.frontmatter.hasMermaid,
			hasCodeInteractions: result.metadata.frontmatter.hasCodeInteractions,
		},
		{
			markdownFeatures: {
				math: false,
				mermaid: false,
				codeInteractions: false,
			},
			hasMath: false,
			hasMermaid: false,
			hasCodeInteractions: false,
		},
	);
});
