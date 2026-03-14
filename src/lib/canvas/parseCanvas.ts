import type { ParsedCanvasJson } from "@/types/canvas";

export function parseCanvasJson(raw: string): ParsedCanvasJson {
	const parsed = JSON.parse(raw) as ParsedCanvasJson;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Canvas JSON is not an object.");
	}
	return parsed;
}
