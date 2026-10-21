import { visit } from "unist-util-visit";

const ADMONITION_TYPES = "note|info|tip|important|warning|caution|details";
const KNOWN_ADOMINITION_TYPES = new Set([
	"note",
	"info",
	"tip",
	"important",
	"warning",
	"caution",
	"details",
]);
/** 常见 GitHub 扩展/社区 alert 类型 → 主题已有配色 */
const ALERT_TYPE_FALLBACK = {
	danger: "caution",
	error: "caution",
	bug: "caution",
	success: "tip",
	question: "info",
	quote: "note",
	abstract: "info",
	example: "info",
	hint: "tip",
	attention: "warning",
	failure: "caution",
};
// [!TYPE] 后可跟折叠标记 "+"（默认展开）或 "-"（默认收起），以及行内自定义标题
const GITHUB_ALERT = /^\s*\[!([^\]\s]+)\]([+-])?[ \t]*(.*)$/i;
const CONTAINER_OPENER = new RegExp(
	`^([\\t ]{0,3})(:{3,})[\\t ]*(${ADMONITION_TYPES})(?![\\w-])(.*)$`,
	"i",
);
const FENCE_OPENER = /^[\t ]{0,3}(`{3,}|~{3,})/;

function escapeAttribute(value) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

/**
 * Normalizes Plume-style spaced container openers into remark-directive syntax.
 * Existing bracket labels and directive attributes pass through unchanged.
 */
export function rewriteAdmonitionContainers(source) {
	if (typeof source !== "string" || !source.includes(":::")) return source;

	let fence = null;
	return source
		.split(/(\r?\n)/)
		.map((part) => {
			if (part === "\n" || part === "\r\n") return part;

			const fenceMatch = part.match(FENCE_OPENER);
			if (fenceMatch) {
				const marker = fenceMatch[1];
				if (!fence) {
					fence = { character: marker[0], length: marker.length };
				} else if (
					marker[0] === fence.character &&
					marker.length >= fence.length &&
					new RegExp(
						`^[\\t ]{0,3}${fence.character}{${fence.length},}[\\t ]*$`,
					).test(part)
				) {
					fence = null;
				}
				return part;
			}

			if (fence) return part;
			const match = part.match(CONTAINER_OPENER);
			if (!match) return part;

			const [, indent, marker, rawType, rawSuffix] = match;
			const type = rawType.toLowerCase();
			const directiveName = type === "details" ? "admonition-details" : type;
			const suffix = rawSuffix.trim();
			if (!suffix) return `${indent}${marker}${directiveName}`;
			if (suffix.startsWith("[") || suffix.startsWith("{")) {
				return `${indent}${marker}${directiveName}${suffix}`;
			}
			if (!/^[\\t ]/.test(rawSuffix)) return part;
			return `${indent}${marker}${directiveName}{title="${escapeAttribute(suffix)}"}`;
		})
		.join("");
}

function normalizeGithubAlerts(tree) {
	visit(tree, "blockquote", (node, index, parent) => {
		if (typeof index !== "number" || !parent) return;
		const [firstParagraph, ...remainingBlocks] = node.children;
		if (firstParagraph?.type !== "paragraph") return;
		const [firstText, ...remainingInline] = firstParagraph.children;
		if (firstText?.type !== "text") return;

		const [declaration, ...remainingLines] = firstText.value.split("\n");
		const match = declaration.match(GITHUB_ALERT);
		if (!match) return;

		const rawType = match[1];
		const collapseToken = match[2];
		const inlineTitle = (match[3] ?? "").trim();
		const normalizedType = rawType.toLowerCase();
		const isKnownType = KNOWN_ADOMINITION_TYPES.has(normalizedType);
		const directiveName = isKnownType
			? normalizedType
			: (ALERT_TYPE_FALLBACK[normalizedType] ?? "note");
		const unknownTypeTitle = isKnownType
			? ""
			: rawType.charAt(0).toUpperCase() + rawType.slice(1);

		const attributes = {};
		let name = directiveName;
		if (collapseToken) {
			// [!type]+ / [!type]- → 原生 <details> 折叠面板
			name = "admonition-details";
			attributes.title =
				inlineTitle || unknownTypeTitle || directiveName.toUpperCase();
			if (collapseToken === "+") attributes.open = "";
		} else if (inlineTitle || unknownTypeTitle) {
			attributes.title = inlineTitle || unknownTypeTitle;
		}

		const firstLine = remainingLines.join("\n");
		const paragraphChildren = [
			...(firstLine ? [{ ...firstText, value: firstLine }] : []),
			...remainingInline,
		];
		const alertChildren = [
			...(paragraphChildren.length > 0
				? [{ ...firstParagraph, children: paragraphChildren }]
				: []),
			...remainingBlocks,
		];

		parent.children[index] = {
			type: "containerDirective",
			name,
			attributes,
			children: alertChildren,
		};
	});
}

export function remarkAdmonitions() {
	const parser = this.parser;
	if (typeof parser !== "function") {
		throw new TypeError(
			"remarkAdmonitions requires an initialized Markdown parser.",
		);
	}

	this.parser = function parseAdmonitions(source) {
		return parser(rewriteAdmonitionContainers(source));
	};

	return normalizeGithubAlerts;
}
