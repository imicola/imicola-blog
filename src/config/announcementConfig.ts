import type { AnnouncementConfig } from "@/types/announcementConfig";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = {
	title: "今天干了什么", // 公告标题，填空使用 i18n 字符串 Key.announcement
	content: "计算机网络好难，简单做了一个小测试网站，可以用用喵", // 公告内容
	closable: true, // 允许用户关闭公告
	link: {
		enable: false, // 启用链接
		text: "点我进入", // 链接文本
		url: "/", // 链接 URL
		external: false, // 外部链接
	},
};
