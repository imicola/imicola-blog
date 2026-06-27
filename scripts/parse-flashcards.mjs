import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TYP_FILE = path.join(__dirname, "../temp/计算机网络.typ");
const OUT_FILE = path.join(__dirname, "../src/data/flashcards.ts");

const raw = fs.readFileSync(TYP_FILE, "utf-8");

const CHAPTER_MAP = {
	小题: { id: "choice", type: "choice", title: "选择题" },
	填空题: {
		id: "fill-blank",
		type: "fill-blank",
		title: "填空题",
	},
	简答题: {
		id: "short-answer",
		type: "short-answer",
		title: "简答题",
	},
	计算大题: {
		id: "calculation",
		type: "calculation",
		title: "计算大题",
	},
};

const SECTION_MAP = {
	choice: {
		概述: "choice-overview",
		物理层: "choice-physical",
		数据链路层: "choice-datalink",
		网络层: "choice-network",
		运输层: "choice-transport",
		应用层: "choice-application",
	},
	"fill-blank": {
		概述: "fill-overview",
		物理层: "fill-physical",
		数据链路层: "fill-datalink",
		网络层: "fill-network",
		运输层: "fill-transport",
	},
	"short-answer": {
		概述: "short-overview",
		物理层: "short-physical",
		数据链路层: "short-datalink",
		网络层: "short-network",
		运输层: "short-transport",
		应用层: "short-application",
	},
	calculation: {
		作业题目: "calc-homework",
		"24-25": "calc-exam",
		自收集题目: "calc-collected",
	},
};

function findClosingBracket(text, startPos) {
	let pos = startPos;
	let depth = 1;

	while (pos < text.length && depth > 0) {
		const ch = text[pos];

		if (ch === "/" && text[pos + 1] === "/") {
			const nl = text.indexOf("\n", pos);
			if (nl === -1) return -1;
			pos = nl + 1;
			continue;
		}

		if (ch === "$") {
			pos++;
			while (pos < text.length && text[pos] !== "$") {
				if (text[pos] === '"') {
					pos++;
					while (pos < text.length && text[pos] !== '"') pos++;
				}
				pos++;
			}
			pos++;
			continue;
		}

		if (ch === '"') {
			pos++;
			while (pos < text.length && text[pos] !== '"') pos++;
			pos++;
			continue;
		}

		if (ch === "[") depth++;
		else if (ch === "]") depth--;
		pos++;
	}

	return depth === 0 ? pos - 1 : -1;
}

function convertMath(typstMath) {
	let s = typstMath;

	s = s.replace(/"([^"]*)"/g, "\\text{$1}");
	s = s.replace(/\btimes\b/g, "\\times");
	s = s.replace(/(?<!\\)\bdot\b/g, "\\cdot");
	s = s.replace(/(\d)dot\b/g, "$1\\cdot");
	s = s.replace(/\bdiv\b/g, "\\div");
	s = s.replace(/\bapprox\b/g, "\\approx");
	s = s.replace(/\barrow\.r\b/g, "\\rightarrow");
	s = s.replace(/\barrow\.l\b/g, "\\leftarrow");
	s = s.replace(/\barrow\.r\.double\b/g, "\\Rightarrow");
	s = s.replace(/\blt\.eq\b/g, "\\le");
	s = s.replace(/\bgt\.eq\b/g, "\\ge");
	s = s.replace(/\blt\.lt\b/g, "\\ll");
	s = s.replace(/\bgt\.gt\b/g, "\\gg");
	s = s.replace(/\binfinity\b/g, "\\infty");
	s = s.replace(/\balpha\b/g, "\\alpha");
	s = s.replace(/\bbeta\b/g, "\\beta");
	s = s.replace(/\bgamma\b/g, "\\gamma");
	s = s.replace(/\bdelta\b/g, "\\delta");
	s = s.replace(/\btheta\b/g, "\\theta");
	s = s.replace(/\blambda\b/g, "\\lambda");
	s = s.replace(/\bmu\b/g, "\\mu");
	s = s.replace(/\bpi\b/g, "\\pi");
	s = s.replace(/\bphi\b/g, "\\phi");
	s = s.replace(/\bomega\b/g, "\\omega");
	s = s.replace(/\bDelta\b/g, "\\Delta");
	s = s.replace(/\bSigma\b/g, "\\Sigma");
	s = s.replace(/\bOmega\b/g, "\\Omega");
	s = s.replace(/\binf\b/g, "\\inf");
	s = s.replace(/\bln\b/g, "\\ln");
	s = s.replace(/\blog\b/g, "\\log");
	s = s.replace(/\bsqrt\b/g, "\\sqrt");

	s = s.replace(/#h\([\d.]+em\)/g, "\\quad ");
	s = s.replace(/#h\([^)]+\)/g, "\\quad ");

	s = s.replace(/#\(([\d\s+\-*/.()]+)\)/g, (m, expr) => {
		try {
			return String(Function(`return ${expr}`)());
		} catch {
			return m;
		}
	});

	s = s.replace(/@[\w]+/g, "");

	if (s.includes("&") && s.includes("-----")) {
		const lines = s.split("\n");
		const textLines = lines.map((line) =>
			line
				.replace(/&/g, " ")
				.replace(/-{3,}/g, "--------")
				.replace(/\\quad /g, "  ")
				.replace(/\\rightarrow/g, "->")
				.replace(/\\text\{([^}]*)\}/g, "$1")
				.trim(),
		);
		return "@@PLAINTEXT@@" + textLines.filter((l) => l).join("\n");
	}

	s = s.replace(/\\(\s*\n|\s*$)/g, " \\\\\n");
	s = s.replace(/\n[ \t]+/g, "\n");
	s = s.replace(/\n{2,}/g, "\n");
	s = s.trim();

	return s;
}

function convertContent(typstText) {
	let s = typstText;

	s = s.replace(/\r\n/g, "\n");

	const mathBlocks = [];
	s = s.replace(/\$([\s\S]+?)\$/g, (match, mathContent) => {
		const isBlock =
			mathContent.includes("\n") ||
			/^\s/.test(mathContent) ||
			/\s$/.test(mathContent);
		const converted = convertMath(mathContent);
		let rendered;
		if (converted.startsWith("@@PLAINTEXT@@")) {
			rendered = `\n\n\`\`\`\n${converted.replace("@@PLAINTEXT@@", "").trim()}\n\`\`\`\n\n`;
		} else if (isBlock) {
			if (converted.includes("&")) {
				rendered = `$$\\begin{aligned}\n${converted}\n\\end{aligned}$$`;
			} else {
				rendered = `$$${converted}$$`;
			}
		} else {
			rendered = `$${converted}$`;
		}
		const placeholder = `@@MATH${mathBlocks.length}@@`;
		mathBlocks.push(rendered);
		return placeholder;
	});

	s = s.replace(/#emph\[([^\]]*)\]/g, "**$1**");
	s = s.replace(/#strike\[([^\]]*)\]/g, "~~$1~~");
	s = s.replace(/#tip\[([\s\S]*?)\]/g, "> $1");
	s = s.replace(/#definition\[([\s\S]*?)\]/g, "**定义**: $1");

	s = s.replace(/\\underline\(#h\([\d.]+em\)\)/g, "______");
	s = s.replace(/\\underline\(#h\([^)]+\)\)/g, "______");

	s = s.replace(/#quad\s*/g, " ");
	s = s.replace(/#h\([\d.]+em\)/g, " ");
	s = s.replace(/#h\([^)]+\)/g, " ");

	s = s.replace(/#sym\.star\.stroked\s*/g, "★ ");
	s = s.replace(/#sym\.star\s*/g, "★ ");
	s = s.replace(/#sym\.Nu\s*/g, "N");
	s = s.replace(/#sym\.[a-z.]+\s*/g, "");

	let listNum = 0;
	s = s.replace(/^(\s*)\+ /gm, (match, indent) => {
		listNum++;
		return `${indent}${listNum}. `;
	});

	s = s.replace(/\*([^*]+)\*/g, "**$1**");

	s = s.replace(/\\\n/g, "\n");
	s = s.replace(/\\([ \t]*\n)/g, "$1");

	s = s.replace(/^\t+/gm, "");
	s = s.replace(/ {2,}/g, " ");
	s = s.replace(/\n{3,}/g, "\n\n");
	s = s.replace(/^\s+/, "");
	s = s.replace(/\s+$/, "");

	for (let i = 0; i < mathBlocks.length; i++) {
		s = s.replace(`@@MATH${i}@@`, () => mathBlocks[i]);
	}

	s = s.replace(/\n{3,}/g, "\n\n");
	return s.trim();
}

function extractBlock(text, startPattern, searchFrom) {
	const pattern = new RegExp(startPattern, "g");
	pattern.lastIndex = searchFrom;
	const match = pattern.exec(text);
	if (!match) return null;

	const bracketPos = match.index + match[0].length;
	if (text[bracketPos] !== "[") return null;

	const closingPos = findClosingBracket(text, bracketPos + 1);
	if (closingPos === -1) return null;

	const content = text.slice(bracketPos + 1, closingPos);
	return {
		content: convertContent(content),
		rawContent: content,
		end: closingPos + 1,
		start: match.index,
	};
}

function parseChapterSubtitle(text, startPos) {
	const chapterPattern = /#chapter-page\(\s*\n?\s*title:\s*"([^"]+)"\s*,\s*\n?\s*subtitle:\s*"([^"]+)"/g;
	chapterPattern.lastIndex = startPos;
	const match = chapterPattern.exec(text);
	if (!match) return null;
	return {
		subtitle: match[2],
		end: match.index + match[0].length,
		start: match.index,
	};
}

const cards = [];
const chaptersSet = new Map();
const sectionsSet = new Map();
let currentChapterInfo = null;
let currentSectionTitle = null;
let currentSubsectionTitle = null;
let cardCounters = {};

let pos = 0;
const lines = raw.split("\n");
let lineStartOffsets = [0];
for (let i = 0; i < lines.length - 1; i++) {
	lineStartOffsets[i + 1] = lineStartOffsets[i] + lines[i].length + 1;
}

for (let i = 0; i < lines.length; i++) {
	const line = lines[i];
	const lineOffset = lineStartOffsets[i];

	const chMatch = parseChapterSubtitle(raw, lineOffset);
	if (chMatch && chMatch.start === lineOffset) {
		const subtitle = chMatch.subtitle;
		if (CHAPTER_MAP[subtitle]) {
			currentChapterInfo = CHAPTER_MAP[subtitle];
			chaptersSet.set(currentChapterInfo.id, {
				id: currentChapterInfo.id,
				title: currentChapterInfo.title,
				type: currentChapterInfo.type,
			});
			cardCounters[currentChapterInfo.id] = 0;
		}
		i = raw.slice(0, chMatch.end).split("\n").length - 1;
		continue;
	}

	const secMatch = line.match(/^==\s+(.+)/);
	if (secMatch && currentChapterInfo) {
		let title = secMatch[1].trim();
		title = title.replace(/#sym\.[a-z.]+\s*/g, "");
		title = title.replace(/\*([^*]+)\*/g, "$1");
		title = title.trim();
		currentSectionTitle = title;

		if (SECTION_MAP[currentChapterInfo.type]?.[title]) {
			const secId = SECTION_MAP[currentChapterInfo.type][title];
			sectionsSet.set(secId, {
				id: secId,
				chapterId: currentChapterInfo.id,
				title: title,
			});
		}
		currentSubsectionTitle = null;
		continue;
	}

	const subsecMatch = line.match(/^===\s+(.+)/);
	if (subsecMatch && currentChapterInfo) {
		let title = subsecMatch[1].trim();
		title = title.replace(/#sym\.[a-z.]+\s*/g, "");
		title = title.replace(/\*([^*]+)\*/g, "$1");
		title = title.replace(/<[^>]+>/g, "");
		currentSubsectionTitle = title.trim();
		continue;
	}
}

const allProblems = [];
pos = 0;
while (true) {
	const problem = extractBlock(raw, "#problem\\(\\)", pos);
	if (!problem) break;

	const solution = extractBlock(raw, "#solution\\(\\)", problem.end);

	allProblems.push({
		problem: problem,
		solution: solution,
		nextPos: solution ? solution.end : problem.end,
	});
	pos = solution ? solution.end : problem.end;
}

let lastChapterBeforePos = null;
let lastSectionBeforePos = null;
let lastSubsectionBeforePos = null;

for (const item of allProblems) {
	const problemPos = item.problem.start;

	let chapterInfo = null;
	let sectionTitle = null;
	let subsectionTitle = null;

	let chSearchPos = 0;
	const chPattern = /#chapter-page\(\s*\n?\s*title:\s*"[^"]+"\s*,\s*\n?\s*subtitle:\s*"([^"]+)"/g;
	let chMatch;
	let lastCh = null;
	while ((chMatch = chPattern.exec(raw)) !== null && chMatch.index < problemPos) {
		const subtitle = chMatch[1];
		if (CHAPTER_MAP[subtitle]) {
			lastCh = CHAPTER_MAP[subtitle];
		}
	}
	chapterInfo = lastCh;

	const beforeProblem = raw.slice(0, problemPos);
	const secLines = beforeProblem.split("\n");
	for (const line of secLines) {
		const m2 = line.match(/^==\s+(.+)/);
		if (m2 && chapterInfo) {
			let t = m2[1].trim().replace(/#sym\.[a-z.]+\s*/g, "").replace(/\*([^*]+)\*/g, "$1").trim();
			sectionTitle = t;
			subsectionTitle = null;
		}
		const m3 = line.match(/^===\s+(.+)/);
		if (m3) {
			let t = m3[1].trim().replace(/#sym\.[a-z.]+\s*/g, "").replace(/\*([^*]+)\*/g, "$1").replace(/<[^>]+>/g, "").trim();
			subsectionTitle = t;
		}
	}

	if (!chapterInfo) continue;

	cardCounters[chapterInfo.id] = (cardCounters[chapterInfo.id] || 0) + 1;
	const cardId = `${chapterInfo.id}-${cardCounters[chapterInfo.id]}`;

	let front = item.problem.content;
	let back = item.solution ? item.solution.content : "";

	if (chapterInfo.type === "calculation" && subsectionTitle) {
		front = `**${subsectionTitle}**\n\n${front}`;
	}

	cards.push({
		id: cardId,
		type: chapterInfo.type,
		chapter: chapterInfo.title,
		section: sectionTitle || "",
		front: front,
		back: back,
	});
}

const chaptersList = [
	{ id: "choice", title: "选择题", type: "choice" },
	{ id: "fill-blank", title: "填空题", type: "fill-blank" },
	{ id: "short-answer", title: "简答题", type: "short-answer" },
	{ id: "calculation", title: "计算大题", type: "calculation" },
];

const chapterCardCounts = {};
for (const ch of chaptersList) {
	chapterCardCounts[ch.id] = cards.filter((c) => {
		const cardTypeId = chaptersList.find(
			(ch2) => ch2.title === c.chapter,
		)?.id;
		return cardTypeId === ch.id;
	}).length;
}

const sectionsList = [];
const seenSections = new Set();
for (const card of cards) {
	const chapterInfo = chaptersList.find((ch) => ch.title === card.chapter);
	if (!chapterInfo || !card.section) continue;
	const secId =
		SECTION_MAP[chapterInfo.type]?.[card.section] ||
		`${chapterInfo.id}-${card.section}`;
	if (!seenSections.has(secId)) {
		seenSections.add(secId);
		sectionsList.push({
			id: secId,
			chapterId: chapterInfo.id,
			title: card.section,
		});
	}
}

const typeCounts = {};
for (const card of cards) {
	typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
}

console.log("=== Parser Results ===");
console.log(`Total cards: ${cards.length}`);
for (const [type, count] of Object.entries(typeCounts)) {
	console.log(`  ${type}: ${count}`);
}
console.log(`Chapters: ${chaptersList.length}`);
console.log(`Sections: ${sectionsList.length}`);
console.log(
	`Sample card front: ${cards[0]?.front.slice(0, 80) || "NONE"}...`,
);

function escapeForTS(str) {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n");
}

let output = `// Auto-generated by scripts/parse-flashcards.mjs from temp/计算机网络.typ\n`;
output += `// DO NOT EDIT MANUALLY - run \`node scripts/parse-flashcards.mjs\` to regenerate\n\n`;
output += `export type CardType = "choice" | "fill-blank" | "short-answer" | "calculation";\n\n`;
output += `export interface Flashcard {\n\tid: string;\n\ttype: CardType;\n\tchapter: string;\n\tsection: string;\n\tfront: string;\n\tback: string;\n}\n\n`;
output += `export interface ChapterInfo {\n\tid: string;\n\ttitle: string;\n\ttype: CardType;\n}\n\n`;
output += `export interface SectionInfo {\n\tid: string;\n\tchapterId: string;\n\ttitle: string;\n}\n\n`;
output += `export interface FlashcardData {\n\tcards: Flashcard[];\n\tchapters: ChapterInfo[];\n\tsections: SectionInfo[];\n}\n\n`;

output += `export const chapters: ChapterInfo[] = [\n`;
for (const ch of chaptersList) {
	output += `\t{ id: "${ch.id}", title: "${ch.title}", type: "${ch.type}" },\n`;
}
output += `];\n\n`;

output += `export const sections: SectionInfo[] = [\n`;
for (const sec of sectionsList) {
	output += `\t{ id: "${sec.id}", chapterId: "${sec.chapterId}", title: "${escapeForTS(sec.title)}" },\n`;
}
output += `];\n\n`;

output += `export const flashcardData: Flashcard[] = [\n`;
for (const card of cards) {
	output += `\t{\n`;
	output += `\t\tid: "${card.id}",\n`;
	output += `\t\ttype: "${card.type}",\n`;
	output += `\t\tchapter: "${escapeForTS(card.chapter)}",\n`;
	output += `\t\tsection: "${escapeForTS(card.section)}",\n`;
	output += `\t\tfront: "${escapeForTS(card.front)}",\n`;
	output += `\t\tback: "${escapeForTS(card.back)}",\n`;
	output += `\t},\n`;
}
output += `];\n`;

fs.writeFileSync(OUT_FILE, output);
console.log(`\nWritten to ${OUT_FILE}`);
