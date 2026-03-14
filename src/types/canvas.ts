export type CanvasDisplayMode = "inline" | "full";

export interface CanvasFrontmatterObject {
	src: string;
	mode?: CanvasDisplayMode;
	height?: number;
}

export type CanvasFrontmatter = string | CanvasFrontmatterObject | false;

export type CanvasNodeType = "text" | "group" | "link" | "file" | "unsupported";

export type CanvasSide = "top" | "right" | "bottom" | "left";

export type CanvasEdgeEnd = "none" | "arrow";

export interface CanvasBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
}

export interface CanvasAssetResolved {
	kind: "image" | "external" | "file" | "missing";
	label: string;
	src?: string;
	href?: string;
	isImage: boolean;
	isMarkdown?: boolean;
	textPreview?: string;
}

export interface CanvasNodeBase {
	id: string;
	type: CanvasNodeType;
	rawType: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color?: string;
}

export interface CanvasTextNode extends CanvasNodeBase {
	type: "text";
	text: string;
}

export interface CanvasGroupNode extends CanvasNodeBase {
	type: "group";
	label: string;
}

export interface CanvasLinkNode extends CanvasNodeBase {
	type: "link";
	href: string;
	label: string;
}

export interface CanvasFileNode extends CanvasNodeBase {
	type: "file";
	file: string;
	asset: CanvasAssetResolved;
}

export interface CanvasUnsupportedNode extends CanvasNodeBase {
	type: "unsupported";
	label: string;
}

export type CanvasNode =
	| CanvasTextNode
	| CanvasGroupNode
	| CanvasLinkNode
	| CanvasFileNode
	| CanvasUnsupportedNode;

export interface CanvasEdge {
	id: string;
	fromNode: string;
	toNode: string;
	fromSide?: CanvasSide;
	toSide?: CanvasSide;
	fromEnd?: CanvasEdgeEnd;
	toEnd?: CanvasEdgeEnd;
	label?: string;
	color?: string;
}

export interface CanvasMeta {
	sourcePath: string;
	warnings: string[];
}

export interface NormalizedCanvasData {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
	bounds: CanvasBounds;
	meta: CanvasMeta;
}

export interface CanvasRenderConfig {
	mode: CanvasDisplayMode;
	height: number;
}

export interface CanvasLoadResult {
	shouldRender: boolean;
	config: CanvasRenderConfig;
	sourcePath?: string;
	data?: NormalizedCanvasData;
	error?: string;
}

export interface ParsedCanvasJson {
	nodes?: unknown[];
	edges?: unknown[];
	[key: string]: unknown;
}
