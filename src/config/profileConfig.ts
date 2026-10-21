import type { ProfileConfig } from "@/types/config";

/**
 * 博主资料：头像 / 名称 / 简介 / 社交链接（侧栏 Profile 卡片、页脚、RSS 作者等消费）。
 * 类型见 src/types/config.ts。
 */
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/nona_cut.webp", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "imicola",
	bio: "为自由而自由,为意志而意志,为道德而道德",
	links: [
		{
			name: "Bilibili",
			icon: "simple-icons:bilibili", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://space.bilibili.com/307453935",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/imicola",
		},
		{
			name: "Codeberg",
			icon: "simple-icons:codeberg",
			url: "https://codeberg.org",
		},
	],
};
