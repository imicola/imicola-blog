---
title: 目录访问与文件操作
published: 2026-02-09
pinned: false
description: 一些Linux的基本知识，感谢Linux101课程
tags: [Linux]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-02-09
pubDate: 2026-3-11
---


# 操作文件与目录

在 linux 中进行操作文件与目录是使用 Linux 的最基础的一个功能，在linux中不同于Windows和macOS下在图形界面简单拖拽文件就能完成文件移动，在linux中我们更加倾向于在命令行中完成操作

## 查看当前命令行目录

要想进行文件管理和操作，我们得先知道我们在哪？一般而言，shell环境会显示我们当前的位置，这点我们在 [[Shell#在shell中导航|在shell中导航]] 这一块中有提到，同时，使用`pwd`命令也可以获取我们目前shell所在的目录

## 查看文件夹内容

我们主要通过 `ls` 命令来查看当前文件夹下的内容，ls默认会隐藏目录下  `.` 开头的文件和文件夹，如果需要将其全部输出可以使用 `ls -a` 来查看所有文件

> 有一些项目里还会提供树状图结构的目录，这其实可以通过`tree`命令生成，在使用前需要安装

> [!tip]  
> [eza](https://github.com/eza-community/eza)是`ls`的现代化代替品，输出会更加好看
> ```bash
> sudo pacman -S eza
> ```
> `eza`几乎可以代替 `ls` 作为文件目录输出索引，传入的参数和 `ls` 也几乎一致，故我们可以用
> ```bash
> alias ls=eza
> ```
> 来直接将 `ls` 替换为 `eza`
> 
> ![alt text](<Pasted image 20260209180009.png>)

---

# 查看文件内容

## cat

当我们需要在终端中查看一个文件的内容的时候我们只需要 `cat <文件名>` 即可

> [!note] 
> 为什么叫cat  
> 当然和猫咪没有关系，cat 这里是 con**cat**enate（连接）的缩写，因为 cat 工具实际的功能是连接多个文件，然后输出。但是当只有一个文件的时候，cat 就会直接输出这个文件，所以 cat 最常见的用途就是输出单个文件。

## less

`less` 和 `cat` 的区别在于， `cat` 会一次性将所有内容打印到终端中并退出，而less一次只显示一页并且支持向前后滚动和搜索功能，通常情况下`less`会比`cat`方便许多

> 实际上在Linux还有 `more` 和 `most` 两个和 `less` 类似的指令，但是流行程度不如 `less`

# 编辑文件内容 

这部分内容可见[[编辑器(vim)]]

# 复制剪切文件和目录

这部分常用的指令是[[cp]]和[[mv]]

`cp` 命令用于对文件进行复制

```bash
# 将 源文件 复制到当前目录下，其名称为后一个参数
cp [OPT] <源文件名称> <新文件名称>
# 将 SOURCE 文件拷贝到 DIRECTORY 目录下，SOURCE 可以为不止一个文件 
cp [OPTION] SOURCE... DIRECTORY
```

`mv`的使用方法与`cp`类似，效果类似Windows下的剪切

```bash
# 将 源文件 剪切到当前目录下，其名称为后一个参数(其实就是重命名功能)
mv [OPT] <源文件名称> <新文件名称>
# 将 SOURCE 文件拷贝到 DIRECTORY 目录下，SOURCE 可以为不止一个文件 
mv [OPTION] SOURCE... DIRECTORY
```

---

# 删除文件

> [!danger]  
> 当你在终端使用 `rm` 命令时候，这个操作将是不可逆的，你将会永远失去你删除的文件，特别是在 `root` 权限和使用 `-r` 参数的时候

使用命令 `rm`

```bash
rm [OPT] <file>
# 删除文件file1.txt
rm file.txt
# 删除test目录下所有文件
rm -r test/
# 尝试强制删除 test1/、test2/、file1.txt 文件和目录。这些文件或者目录可能不存在、有写保护或者没有权限读写
rm -rf test1/ test2/ file1.txt
```

除非你的计算机存在特殊备份措施或恢复措施，否则 `rm` 进行的删除命令是无法还原的

> [!Warning]  
> 在使用 `rm` 删除的时候，请务必注意目录拼写
> ```bash
> rm -rf /home/imicola/f # 删除f
> rm -rf / home/imicola/f # 删除根目录下的所有内容和 home/imicola/f 及其中的文件
> ```

> [!tip]
> 
> `rm` 指令之所以危险是因为其是不可逆的，我们可以使用更加现代化且安全的 `trash-cli` 来代替 `rm` 指令。这和在 Windows 下删除文件进入回收站的逻辑是一致的

---

# 创建文件

使用 `touch` 命令创建文件

```bash
touch file1 file2
```

> touch命令的时间功能是修改文件的访问时间和修改时间，类似于摸了一下文件，使其访问和修改时间发生了变化

# 搜索文件和目录

```bash
# 在 PATH路径中根据 表达式 搜索文件
find [opt] PATH [表达式]
```

> [!tip]  
> 在当前目录中搜索名为 report.pdf 的wenj
> ```bash
> find . -name 'report.pdf'
> ```
> 全盘搜索大于 1G 的文件
> ```bash
> find / -size +1G
> ```

> [!tip]  
> 对于文件搜索，我们同样有更好用的代替，如果是对于搜索文件，可以尝试 `fzf` 进行交互式模糊搜索，如果是希望有格式有条件的筛选，可以选择 `fd`，更多有关这部分的内容可以看[[文件查询]]


## 统计文件或文件夹大小

`du` 命令可以实现文件和文件夹大小的统计，一般而言我们可以直接使用 `du -sh` 来显示目标文件的总大小，用 `du -h -d 1` 显示当前目录下的总大小

此外，使用 `ncdu` 可以用交互式的方式来显示文件和目录的大小，并会按文件大小排序

---

# 模式匹配

## 通配

shell的通配字符主要应用在**文件路径的展开上**,需要注意的是,通配不是[[正则表达式]],而是更简单的快速选择文件的符号
- `?` 匹配一个字符
	- 如 `file?.txt`匹配`file1.txt`,`fileA.txt`等
- `*` 匹配任意字符
	- 如 `*.py` 匹配所有 `.py` 结尾的文件
- `[]` 匹配方括号中的任意一个字符
	- 如 `[abc].txt` 匹配 `a.txt,b.txt,c.txt` 
- `{}` 列表生成,即**扩展**为逗号分隔的字符串列表
	- 如 `{test1,test2}.txt` 会被扩展成 `test1.txt test2.txt`



