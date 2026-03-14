import path from "node:path";
import type { CollectionEntry } from "astro:content";
import type {
	CanvasDisplayMode,
	CanvasFrontmatter,
	CanvasLoadResult,
	CanvasRenderConfig,
} from "@/types/canvas";
import { normalizeCanvasData } from "./normalizeCanvas";
import { parseCanvasJson } from "./parseCanvas";

const DEFAULT_HEIGHT = 760;

const canvasRawLoaders = import.meta.glob<string>(
	"/src/content/posts/**/*.canvas",
	{
		query: "?raw",
		import: "default",
	},
);

const imageLoaders = import.meta.glob<ImageMetadata>(
	"/src/content/posts/**/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp,ico}",
	{
		import: "default",
	},
);

const markdownLoaders = import.meta.glob<string>(
	"/src/content/posts/**/*.{md,mdx,markdown}",
	{
		query: "?raw",
		import: "default",
	},
);

interface ResolvedCanvasFrontmatter {
	disabled: boolean;
	src?: string;
	mode: CanvasDisplayMode;
	height: number;
	isExplicit: boolean;
}

function normalizePath(value: string): string {
	return value.replace(/\\/g, "/");
}

function toModuleKey(filePath: string): string {
	return `/${normalizePath(filePath).replace(/^\/+/, "")}`;
}

function resolveRenderConfig(
	mode?: string,
	height?: number,
): CanvasRenderConfig {
	const safeMode: CanvasDisplayMode = mode === "full" ? "full" : "inline";
	const safeHeight =
		typeof height === "number" && Number.isFinite(height)
			? Math.min(Math.max(height, 320), 1400)
			: DEFAULT_HEIGHT;
	return {
		mode: safeMode,
		height: safeHeight,
	};
}

function resolveCanvasFrontmatter(
	canvas: CanvasFrontmatter | undefined,
	postDir: string,
): ResolvedCanvasFrontmatter {
	if (canvas === false) {
		return {
			disabled: true,
			...resolveRenderConfig(),
			isExplicit: true,
		};
	}

	if (typeof canvas === "string") {
		const src = normalizePath(
			path.posix.normalize(path.posix.join(postDir, canvas)),
		);
		return {
			disabled: false,
			src,
			...resolveRenderConfig(),
			isExplicit: true,
		};
	}

	if (
		canvas &&
		typeof canvas === "object" &&
		typeof canvas.src === "string"
	) {
		const src = normalizePath(
			path.posix.normalize(path.posix.join(postDir, canvas.src)),
		);
		return {
			disabled: false,
			src,
			...resolveRenderConfig(canvas.mode, canvas.height),
			isExplicit: true,
		};
	}

	return {
		disabled: false,
		...resolveRenderConfig(),
		isExplicit: false,
	};
}

function autoDiscoverCanvasPath(postFilePath: string): string {
	const postDir = path.posix.dirname(postFilePath);
	return path.posix.join(postDir, "index.canvas");
}

export async function loadCanvasForPost(
	entry: CollectionEntry<"posts">,
): Promise<CanvasLoadResult> {
	// Resolve frontmatter + auto-discovery, then parse and normalize to a stable shape.
	const postFilePath = normalizePath(entry.filePath || "");
	const postDir = path.posix.dirname(postFilePath);
	const frontmatterCanvas = entry.data.canvas as
		| CanvasFrontmatter
		| undefined;
	const resolvedFrontmatter = resolveCanvasFrontmatter(
		frontmatterCanvas,
		postDir,
	);
	const config: CanvasRenderConfig = {
		mode: resolvedFrontmatter.mode,
		height: resolvedFrontmatter.height,
	};

	if (resolvedFrontmatter.disabled) {
		return {
			shouldRender: false,
			config,
		};
	}

	const sourcePath =
		resolvedFrontmatter.src || autoDiscoverCanvasPath(postFilePath);
	const rawLoader = canvasRawLoaders[toModuleKey(sourcePath)];

	if (!rawLoader) {
		if (resolvedFrontmatter.isExplicit) {
			return {
				shouldRender: true,
				config,
				sourcePath,
				error: `Canvas file not found: ${sourcePath}`,
			};
		}
		return {
			shouldRender: false,
			config,
		};
	}

	try {
		const raw = await rawLoader();
		const parsed = parseCanvasJson(raw);
		const data = await normalizeCanvasData({
			parsed,
			sourcePath,
			imageLoaders,
			markdownLoaders,
		});
		return {
			shouldRender: true,
			config,
			sourcePath,
			data,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown canvas error.";
		return {
			shouldRender: true,
			config,
			sourcePath,
			error: message,
		};
	}
}
