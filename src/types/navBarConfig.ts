/**
 * 导航配置类型。
 * pageKey：预设的页面标识，配合 nav-utils 的 resolvePageKey 统一驱动
 * 顶栏 / 抽屉高亮（含分类筛选、标签筛选等动态页面）。
 */
export type NavBarLink = {
	name: string;
	url?: string;
	icon?: string;
	/** 页面标识（home/archive/categories/tags/about/github…），驱动高亮 */
	pageKey?: string;
	external?: boolean;
	children?: NavBarLink[];
};

export type NavBarConfig = {
	links: NavBarLink[];
};
