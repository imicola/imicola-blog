// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "imicola",
		imgurl: "https://avatars.githubusercontent.com/u/176208294?v=4",
		desc: "这是窝！",
		siteurl: "https://github.com/imicola",
		tags: ["Personal"],
	},
	{
		id: 2,
		title: "imicola library",
		imgurl: "https://ts1.tc.mm.bing.net/th/id/OIP-C.T-4_tSTEuaJHMqrZtdIN4gHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
		desc: "imicola的知识中心，很多笔记都在这里面",
		siteurl: "https://imicola.github.io",
		tags: ["Blog", "Knowledge Base"],
	},
	{
		id: 3,
		title: "alisa22580",
		imgurl: "https://avatars.githubusercontent.com/u/181569820?v=4",
		desc: "关注Alisa喵,他是一个真正的男娘",
		siteurl: "https://alisa22580.pages.dev",
		tags: ["Friend"],
	},
	{
		id: 4,
		title: "wcx",
		imgurl: "https://avatars.githubusercontent.com/u/206184165?v=4",
		siteurl: "https://wcx684.github.io",
		desc: "这是wcx,他是一个真正的man",
		tags: ["Friend"],
	},
	{
		id: 5,
		title: "fatfathao",
		imgurl: "https://avatars.githubusercontent.com/u/155948622?v=4",
		desc: "关注fatfathao喵，关注fatfathao谢谢喵",
		siteurl: "https://fatfathao.top",
		tags: ["Friend"],
	},
	{
		id: 6,
		title: "奇奇莫拉の日记本",
		imgurl: "https://qiqimora.cn/_astro/avatar.qk8rO0hW_1zxmdw.webp",
		desc: "咱是奇奇莫拉，今天也不想出门qwq",
		siteurl: "https://qiqimora.cn/",
		tags: ["Friend"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
