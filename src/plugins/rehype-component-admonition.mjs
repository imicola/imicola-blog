/// <reference types="mdast" />
import { h } from "hastscript";

const KNOWN_ALERT_TYPES = new Set([
	"tip",
	"note",
	"important",
	"caution",
	"warning",
]);

function formatUnknownTypeLabel(type) {
	if (!type) return "NOTE";
	return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Creates an admonition component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} [properties.title] - An optional title.
 * @param {('tip'|'note'|'important'|'caution'|'warning')} type - The admonition type.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created admonition component.
 */
export function AdmonitionComponent(properties, children, type) {
	if (!Array.isArray(children) || children.length === 0)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid admonition directive. (Admonition directives must be of block type ":::note{name="name"} <content> :::")',
		);

	let label = null;
	if (properties?.["has-directive-label"]) {
		label = children[0]; // The first child is the label
		// biome-ignore lint/style/noParameterAssign: <check later>
		children = children.slice(1);
		label.tagName = "div"; // Change the tag <p> to <div>
	}

	const rawAlertType = String(properties?.["alert-type"] || type || "note");
	const normalizedAlertType = rawAlertType.toLowerCase();
	const isKnownAlertType = KNOWN_ALERT_TYPES.has(normalizedAlertType);
	const styleType = isKnownAlertType ? normalizedAlertType : "note";

	const titleFromAttributes =
		typeof properties?.title === "string" ? properties.title.trim() : "";
	const fallbackTitle = isKnownAlertType
		? normalizedAlertType.toUpperCase()
		: formatUnknownTypeLabel(rawAlertType);
	const titleContent = titleFromAttributes || label || fallbackTitle;

	const collapseState = properties?.["collapse-state"];
	const isCollapsible =
		collapseState === "collapsed" || collapseState === "expanded";
	const isCollapsed = collapseState === "collapsed";

	const blockquoteClasses = [`admonition bdm-${styleType}`];
	if (isCollapsible) {
		blockquoteClasses.push("admonition-collapsible");
	}
	if (isCollapsed) {
		blockquoteClasses.push("is-collapsed");
	}

	const blockquoteProps = {
		class: blockquoteClasses.join(" "),
		"data-alert-type": rawAlertType,
	};

	if (isCollapsible) {
		blockquoteProps["data-collapse-state"] = collapseState;
	}

	return h("blockquote", blockquoteProps, [
		h("span", { class: "bdm-title" }, titleContent),
		...children,
	]);
}
