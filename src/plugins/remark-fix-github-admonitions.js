import { visit } from "unist-util-visit";

const GITHUB_ALERT_DECLARATION_REGEX =
	/^\s*\[\!(?<type>[^\]\s]+)\](?<collapse>[+-])?(?<rest>.*)$/;

const KNOWN_ALERT_TYPE_TO_DIRECTIVE = {
	note: "note",
	tip: "tip",
	important: "important",
	warning: "warning",
	caution: "caution",
};

function parseGithubAlertDeclaration(text) {
	const match = text.match(GITHUB_ALERT_DECLARATION_REGEX);
	const rawType = match?.groups?.type?.trim();
	if (!rawType) return null;

	const normalizedType = rawType.toLowerCase();
	const collapseToken = match?.groups?.collapse;
	const titleText = match?.groups?.rest?.trim() || null;
	const directiveName =
		KNOWN_ALERT_TYPE_TO_DIRECTIVE[normalizedType] ?? "note";

	let collapseState = null;
	if (collapseToken === "-") {
		collapseState = "collapsed";
	} else if (collapseToken === "+") {
		collapseState = "expanded";
	}

	return {
		rawType,
		directiveName,
		titleText,
		collapseState,
	};
}

function getInlineText(node) {
	if (!node) return "";
	if (node.type === "text" || node.type === "inlineCode") {
		return node.value || "";
	}
	if (Array.isArray(node.children)) {
		return node.children.map(getInlineText).join("");
	}
	return "";
}

function getParagraphText(paragraphNode) {
	if (!paragraphNode || !Array.isArray(paragraphNode.children)) return "";
	return paragraphNode.children.map(getInlineText).join("");
}

export function remarkFixGithubAdmonitions() {
	return (tree) => {
		visit(tree, "blockquote", (node, index, parent) => {
			if (!parent || index === undefined) return;

			const firstChild = node.children[0];
			if (firstChild?.type !== "paragraph") return;

			const firstParagraphText = getParagraphText(firstChild);
			if (!firstParagraphText) return;

			const possibleTypeDeclaration = firstParagraphText.split("\n")[0];
			if (!possibleTypeDeclaration) return;

			const declaration =
				parseGithubAlertDeclaration(possibleTypeDeclaration);
			if (!declaration) return;


			const remainingFirstParagraph = firstParagraphText
				.split("\n")
				.slice(1)
				.join("\n");

			const paragraphChildren = remainingFirstParagraph
				? [{ type: "text", value: remainingFirstParagraph }]
				: [];

			const alertParagraphChildren =
				paragraphChildren.length > 0
					? [{ type: "paragraph", children: paragraphChildren }]
					: [];

			const attributes = {
				"alert-type": declaration.rawType,
			};

			if (declaration.titleText) {
				attributes.title = declaration.titleText;
			}

			if (declaration.collapseState) {
				attributes["collapse-state"] = declaration.collapseState;
			}

			const directive = {
				type: "containerDirective",
				name: declaration.directiveName,
				attributes,
				children: [
					...alertParagraphChildren,
					...node.children.slice(1),
				],
			};

			parent.children[index] = directive;
		});
	};
}
