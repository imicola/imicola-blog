import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve("public/images/moments");
const outputDir = path.resolve("public/assets/moments/thumbnails");
const widths = [192, 384, 640];
const supportedExtensions = new Set([
	".avif",
	".jpeg",
	".jpg",
	".png",
	".webp",
]);

async function collectImages(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const images = [];
	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			images.push(...(await collectImages(absolutePath)));
		} else if (
			supportedExtensions.has(path.extname(entry.name).toLowerCase())
		) {
			images.push(absolutePath);
		}
	}
	return images;
}

async function isCurrent(sourcePath, outputPath) {
	try {
		const [sourceStat, outputStat] = await Promise.all([
			fs.stat(sourcePath),
			fs.stat(outputPath),
		]);
		return outputStat.mtimeMs >= sourceStat.mtimeMs && outputStat.size > 0;
	} catch {
		return false;
	}
}

const images = await collectImages(sourceDir);
const expectedOutputs = new Set();
let generated = 0;
for (const sourcePath of images) {
	const relativePath = path.relative(sourceDir, sourcePath);
	const parsed = path.parse(relativePath);
	for (const width of widths) {
		const outputPath = path.join(
			outputDir,
			parsed.dir,
			`${parsed.name}-${width}.webp`,
		);
		expectedOutputs.add(path.resolve(outputPath).toLowerCase());
		if (await isCurrent(sourcePath, outputPath)) continue;
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		await sharp(sourcePath)
			.rotate()
			.resize({ width, withoutEnlargement: true })
			.webp({ quality: 64, effort: 5, smartSubsample: true })
			.toFile(outputPath);
		generated += 1;
	}
}

await fs.mkdir(outputDir, { recursive: true });
let removed = 0;
for (const outputPath of await collectImages(outputDir)) {
	if (expectedOutputs.has(path.resolve(outputPath).toLowerCase())) continue;
	await fs.unlink(outputPath);
	removed += 1;
}

console.log(
	`[moment-thumbnails] ${generated > 0 ? `Generated ${generated}` : "Reused"} thumbnail assets for ${images.length} images${removed > 0 ? `; removed ${removed} stale files` : ""}.`,
);
