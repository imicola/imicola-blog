import path from "node:path";
import type { CanvasAssetResolved } from "@/types/canvas";

const IMAGE_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".avif",
	".svg",
	".bmp",
	".ico",
]);

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx", ".markdown"]);

interface ResolveCanvasAssetOptions {
	fileRef: string;
	canvasPath: string;
	imageLoaders: Record<string, () => Promise<ImageMetadata>>;
	markdownLoaders: Record<string, () => Promise<string>>;
}

function normalizePath(input: string): string {
	return input.replace(/\\/g, "/");
}

function toModuleKey(filePath: string): string {
	return `/${normalizePath(filePath).replace(/^\/+/, "")}`;
}

function isHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

function extensionOf(value: string): string {
	return path.posix.extname(value.toLowerCase());
}

function isImagePath(value: string): boolean {
	return IMAGE_EXTENSIONS.has(extensionOf(value));
}

function isMarkdownPath(value: string): boolean {
	return MARKDOWN_EXTENSIONS.has(extensionOf(value));
}

function buildMarkdownPreview(raw: string): string {
	const noFrontmatter = raw.replace(/^---[\s\S]*?---\s*/m, "");
	return noFrontmatter.trim().slice(0, 1600);
}

export async function resolveCanvasAsset(
	options: ResolveCanvasAssetOptions,
): Promise<CanvasAssetResolved> {
	// Resolve file/link references relative to the canvas file and detect image previews.
	const { fileRef, canvasPath, imageLoaders, markdownLoaders } = options;
	const rawRef = fileRef.trim();
	const fallbackLabel = rawRef || "Unnamed file";

	if (!rawRef) {
		return {
			kind: "missing",
			label: "Missing file reference",
			isImage: false,
		};
	}

	if (isHttpUrl(rawRef)) {
		return {
			kind: isImagePath(rawRef) ? "image" : "external",
			label: rawRef,
			src: isImagePath(rawRef) ? rawRef : undefined,
			href: rawRef,
			isImage: isImagePath(rawRef),
			isMarkdown: isMarkdownPath(rawRef),
		};
	}

	if (rawRef.startsWith("/")) {
		return {
			kind: isImagePath(rawRef) ? "image" : "external",
			label: rawRef,
			src: isImagePath(rawRef) ? rawRef : undefined,
			href: rawRef,
			isImage: isImagePath(rawRef),
			isMarkdown: isMarkdownPath(rawRef),
		};
	}

	const canvasDir = path.posix.dirname(normalizePath(canvasPath));
	const resolvedPath = path.posix.normalize(path.posix.join(canvasDir, rawRef));
	const moduleKey = toModuleKey(resolvedPath);

	const imageLoader = imageLoaders[moduleKey];
	if (imageLoader) {
		try {
			const metadata = await imageLoader();
			return {
				kind: "image",
				label: fallbackLabel,
				src: metadata.src,
				href: metadata.src,
				isImage: true,
			};
		} catch {
			return {
				kind: "missing",
				label: fallbackLabel,
				isImage: true,
			};
		}
	}

	const markdownLoader = markdownLoaders[moduleKey];
	if (markdownLoader) {
		try {
			const rawMarkdown = await markdownLoader();
			return {
				kind: "file",
				label: fallbackLabel,
				isImage: false,
				isMarkdown: true,
				textPreview: buildMarkdownPreview(rawMarkdown),
			};
		} catch {
			return {
				kind: "file",
				label: fallbackLabel,
				isImage: false,
				isMarkdown: true,
			};
		}
	}

	if (isImagePath(rawRef)) {
		return {
			kind: "missing",
			label: fallbackLabel,
			isImage: true,
		};
	}

	return {
		kind: "file",
		label: fallbackLabel,
		isImage: false,
		isMarkdown: isMarkdownPath(rawRef),
	};
}
