import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		pinned: z.boolean().optional().default(false),
		draft: z.boolean().optional().default(false),
		comment: z.boolean().optional().default(true),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),

		/* Per-post author / source / license（自 Mizuki 迁移的文章级元数据） */
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),

		/* AI participation level: 0 none / 1 human-core AI-polish / 2 human-outline AI-fill / 3 AI-generated */
		aiLevel: z.number().int().min(0).max(3).optional(),

		/* Post Encryption */
		encrypted: z.boolean().optional().default(false),
		password: z
			.union([z.string(), z.number()])
			.transform((v) => String(v))
			.optional(),
		passwordHint: z.string().optional().default(""),
		hideHomeContent: z.boolean().optional().default(true),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ base: "./src/content/spec", pattern: "**/*.{md,mdx}" }),
	schema: z.object({}),
});

const momentsCollection = defineCollection({
	loader: glob({ base: "./src/content/moments", pattern: "**/*.md" }),
	schema: z.object({
		published: z.date(),
		pinned: z.boolean().optional().default(false),
		location: z.string().optional().default(""),
		/** 心情（Iconify 图标名，如 material-symbols:sentiment-excited-outline-rounded） */
		mood: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		images: z
			.array(
				z.object({
					src: z.string(),
					alt: z.string().optional().default(""),
				}),
			)
			.optional()
			.default([]),
		draft: z.boolean().optional().default(false),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	moments: momentsCollection,
} as const;
