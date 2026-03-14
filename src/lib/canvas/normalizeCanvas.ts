import type {
	CanvasBounds,
	CanvasEdge,
	CanvasEdgeEnd,
	CanvasNode,
	CanvasSide,
	NormalizedCanvasData,
	ParsedCanvasJson,
} from "@/types/canvas";
import { resolveCanvasAsset } from "./resolveCanvasAsset";

interface NormalizeCanvasOptions {
	parsed: ParsedCanvasJson;
	sourcePath: string;
	imageLoaders: Record<string, () => Promise<ImageMetadata>>;
	markdownLoaders: Record<string, () => Promise<string>>;
}

function toStringValue(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

function toSide(value: unknown): CanvasSide | undefined {
	if (
		value === "top" ||
		value === "right" ||
		value === "bottom" ||
		value === "left"
	) {
		return value;
	}
	return undefined;
}

function toEdgeEnd(value: unknown): CanvasEdgeEnd | undefined {
	if (value === "none" || value === "arrow") {
		return value;
	}
	return undefined;
}

function safeBounds(nodes: CanvasNode[]): CanvasBounds {
	if (nodes.length === 0) {
		return {
			minX: 0,
			minY: 0,
			maxX: 800,
			maxY: 500,
			width: 800,
			height: 500,
		};
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const node of nodes) {
		minX = Math.min(minX, node.x);
		minY = Math.min(minY, node.y);
		maxX = Math.max(maxX, node.x + node.width);
		maxY = Math.max(maxY, node.y + node.height);
	}

	return {
		minX,
		minY,
		maxX,
		maxY,
		width: Math.max(1, maxX - minX),
		height: Math.max(1, maxY - minY),
	};
}

export async function normalizeCanvasData(
	options: NormalizeCanvasOptions,
): Promise<NormalizedCanvasData> {
	// Normalize raw Obsidian canvas JSON into strongly-typed nodes/edges with fallbacks.
	const { parsed, sourcePath, imageLoaders, markdownLoaders } = options;
	const warnings: string[] = [];
	const nodes: CanvasNode[] = [];
	const edges: CanvasEdge[] = [];
	const nodeList = Array.isArray(parsed.nodes) ? parsed.nodes : [];
	const edgeList = Array.isArray(parsed.edges) ? parsed.edges : [];

	for (const item of nodeList) {
		if (!item || typeof item !== "object") {
			warnings.push("Skipped an invalid node entry.");
			continue;
		}

		const node = item as Record<string, unknown>;
		const id = toStringValue(node.id, `node-${nodes.length + 1}`);
		const rawType = toStringValue(node.type, "unsupported");
		const x = toNumberValue(node.x, 0);
		const y = toNumberValue(node.y, 0);
		const width = Math.max(100, toNumberValue(node.width, 260));
		const height = Math.max(48, toNumberValue(node.height, 80));
		const color = toStringValue(node.color, "");

		if (rawType === "text") {
			nodes.push({
				id,
				type: "text",
				rawType,
				x,
				y,
				width,
				height,
				color,
				text: toStringValue(node.text, ""),
			});
			continue;
		}

		if (rawType === "group") {
			nodes.push({
				id,
				type: "group",
				rawType,
				x,
				y,
				width,
				height,
				color,
				label: toStringValue(node.label, "Group"),
			});
			continue;
		}

		if (rawType === "link") {
			const href = toStringValue(node.url, "");
			nodes.push({
				id,
				type: "link",
				rawType,
				x,
				y,
				width,
				height,
				color,
				href,
				label: toStringValue(node.text, href || "Open link"),
			});
			continue;
		}

		if (rawType === "file") {
			const file = toStringValue(node.file, "");
			const asset = await resolveCanvasAsset({
				fileRef: file,
				canvasPath: sourcePath,
				imageLoaders,
				markdownLoaders,
			});
			nodes.push({
				id,
				type: "file",
				rawType,
				x,
				y,
				width,
				height,
				color,
				file,
				asset,
			});
			continue;
		}

		nodes.push({
			id,
			type: "unsupported",
			rawType,
			x,
			y,
			width,
			height,
			color,
			label: toStringValue(node.text, rawType || "Unsupported"),
		});
	}

	const nodeIdSet = new Set(nodes.map((node) => node.id));
	for (const item of edgeList) {
		if (!item || typeof item !== "object") {
			warnings.push("Skipped an invalid edge entry.");
			continue;
		}

		const edgeItem = item as Record<string, unknown>;
		const fromNode = toStringValue(edgeItem.fromNode, "");
		const toNode = toStringValue(edgeItem.toNode, "");
		if (
			!fromNode ||
			!toNode ||
			!nodeIdSet.has(fromNode) ||
			!nodeIdSet.has(toNode)
		) {
			warnings.push("Skipped an edge with missing endpoint nodes.");
			continue;
		}

		edges.push({
			id: toStringValue(edgeItem.id, `edge-${edges.length + 1}`),
			fromNode,
			toNode,
			fromSide: toSide(edgeItem.fromSide),
			toSide: toSide(edgeItem.toSide),
			fromEnd: toEdgeEnd(edgeItem.fromEnd),
			toEnd: toEdgeEnd(edgeItem.toEnd),
			label: toStringValue(edgeItem.label, ""),
			color: toStringValue(edgeItem.color, ""),
		});
	}

	return {
		nodes,
		edges,
		bounds: safeBounds(nodes),
		meta: {
			sourcePath,
			warnings,
		},
	};
}
