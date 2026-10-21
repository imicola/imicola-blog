import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { projectsConfig } from "@/config/projectsConfig";
import { skillsConfig } from "@/config/skillsConfig";
import { timelineConfig } from "@/config/timelineConfig";
import type { NavBarConfig, NavBarLink } from "@/types/navBarConfig";

/**
 * 导航栏配置（统一单一来源）。
 * - LinkPresets：命名链接预设表 —— 名称 / 地址 / 图标单点维护，可整体复用；
 * - navBarConfig：导航结构 —— 顺序 + 分组（children 子菜单），
 *   同时驱动顶栏下拉菜单与全端导航抽屉。
 * 新增入口：先在 LinkPresets 登记预设，再在 navBarConfig.links 按序引用。
 */
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: i18n(I18nKey.home),
		url: "/",
		icon: "material-symbols:home-outline-rounded",
		pageKey: "home",
	},
	Archive: {
		name: i18n(I18nKey.archive),
		url: "/archive/",
		icon: "material-symbols:archive-outline-rounded",
		pageKey: "archive",
	},
	Friends: {
		name: i18n(I18nKey.friends),
		url: "/friends/",
		icon: "material-symbols:handshake-outline-rounded",
		pageKey: "friends",
	},
	Moments: {
		name: i18n(I18nKey.moments),
		url: "/moments/",
		icon: "material-symbols:auto-awesome-outline-rounded",
		pageKey: "moments",
	},
	Anime: {
		name: i18n(I18nKey.anime),
		url: "/anime/",
		icon: "material-symbols:live-tv-outline-rounded",
		pageKey: "anime",
	},
	Compass: {
		name: i18n(I18nKey.compass),
		url: "/compass/",
		icon: "material-symbols:explore-rounded",
		pageKey: "compass",
	},
	Skills: {
		name: i18n(I18nKey.skills),
		url: "/skills/",
		icon: "material-symbols:workspaces-outline-rounded",
		pageKey: "skills",
	},
	Projects: {
		name: i18n(I18nKey.projects),
		url: "/projects/",
		icon: "material-symbols:deployed-code-outline-rounded",
		pageKey: "projects",
	},
	Devices: {
		name: i18n(I18nKey.devices),
		url: "/devices/",
		icon: "material-symbols:devices-rounded",
		pageKey: "devices",
	},
	Timeline: {
		name: i18n(I18nKey.timeline),
		url: "/timeline/",
		icon: "material-symbols:timeline-rounded",
		pageKey: "timeline",
	},
	Albums: {
		name: i18n(I18nKey.albums),
		url: "/albums/",
		icon: "material-symbols:photo-library-outline-rounded",
		pageKey: "albums",
	},
	Categories: {
		name: i18n(I18nKey.categories),
		url: "/categories/",
		icon: "material-symbols:folder-outline-rounded",
		pageKey: "categories",
	},
	Tags: {
		name: i18n(I18nKey.tags),
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
		pageKey: "tags",
	},
	About: {
		name: i18n(I18nKey.about),
		url: "/about/",
		icon: "material-symbols:info-outline-rounded",
		pageKey: "about",
	},
	GitHub: {
		name: "GitHub",
		url: "https://github.com/imicola",
		icon: "fa6-brands:github",
		external: true,
		pageKey: "github",
	},
	Bilibili: {
		name: "Bilibili",
		url: "https://space.bilibili.com/307453935",
		icon: "simple-icons:bilibili",
		external: true,
		pageKey: "bilibili",
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPresets.Home,
		LinkPresets.Archive,
		{
			name: "My",
			icon: "material-symbols:person-outline-rounded",
			children: [
				LinkPresets.Anime,
				LinkPresets.Albums,
				...(timelineConfig.enable ? [LinkPresets.Timeline] : []),
			],
		},
		{
			name: i18n(I18nKey.more),
			icon: "material-symbols:apps-rounded",
			children: [
				...(projectsConfig.enable ? [LinkPresets.Projects] : []),
				...(skillsConfig.enable ? [LinkPresets.Skills] : []),
				LinkPresets.About,
				LinkPresets.Friends,
				// 分类/标签入口不进导航菜单（避免菜单项过多），预设已登记指向独立页面，
				// 需要时取消注释即可
				// LinkPresets.Categories,
				// LinkPresets.Tags,
				LinkPresets.GitHub,
				LinkPresets.Bilibili,
			],
		},
	],
};
