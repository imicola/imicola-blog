---
title: Linux下进行开发
published: 2026-02-04
pinned: false
description: 
    为什么linux是神? 首先是犯下傲慢之罪的Windows,混乱的环境配置和抽象的编译链接；其次是犯下懒惰之罪的MacOS,虽然环境配置和编译链接相对简单，但价格过于昂贵,沦为高雅的玩具。Linux不语，只是一味为开发者提供便利的环境和工具。
tags: [Linux, Development]
category: 技术
licenseName: "MIT"
author: imicola
draft: false
date: 2026-02-04
image: "./cover.jpg"
pubDate: 2026-3-11
---
# Linux开发环境

相比与 Windows，在Linux下进行开发有如下好处：

- 安装简单: 所有开发链在Linux中都可以通过一个命令实现，非常简单
- 配置简单: 大多数的Linux开发工具的配置都可以通过编写配置文件完成，而且可定制性高于Windows
- 管理简单：不用在忍受Windows下恐怖的环境配置和抽象的编译链接

这篇文章主要讲解三个方面的知识:开发软件，编译工具，工程工具

# 开发软件

## 代码编写工具与IDE

### 图形化Linux界面

如果你是图形化的Linux界面，你可以自行安装代码编写工具，目前主流工具都对主流发行版有支持，比如Visual Studio Code提供多种包，也可以通过软件仓库进行安装

同时JetBrains系列的软件也对Linux支持度也很高，你完全可以在官网中或者各个发行版的软件仓库中找到支持的版本并且下载

### WSL

如果你使用的是WSL，即 *Windows Subsystem for Linux*,其实更建议使用 Windows 上的代码编写工具，通过SSH或者WSL链接来获得更好的体验，虽然现在WSL2也原生支持wslg用来匹配GUI，但是其优化程度不如Windows

对于Visual Studio Code，有原生链接wsl的工具，输入`ctrl + shift + P`后输入 `链接到WSL` 即可以链接

# 编译工具

我们在程序课上就学习过，要想让我们写的程序语言变为真正的可执行文件，还需要通过编译器的编译

在Windows中，一般会给一份打包好的安装程序或者编译好的程序压缩包，而使用编译器需要配置环境变量等一系列操作，如果有多个编译程序(多版本管理)的时候还可能会出现编译混乱的情况

在Linux中其实解决了很多这样的问题，下面我们通过介绍几个例子

## C++环境

在 Windows 上，你可能需要下载几个 GB 的 Visual Studio，或者手动配置 MinGW 的 `bin` 路径。
- **Linux 的做法：** 只需一行命令安装 `build-essential`（以 Ubuntu 为例），它会自动帮你装好 `gcc`、`g++`、`make` 以及标准库头文件。

```sh
sudo apt update && sudo apt install build-essential
```

- **便利点：** 安装完即用，不需要去系统属性里手动编辑 `PATH`。所有的头文件都在 `/usr/include`，库文件在 `/usr/lib`，编译器永远能找到它们。

---

## Python环境

Windows 中管理 3.8、3.10、3.12 等多个python版本是比较棘手的

- **Linux 的做法：** 大多数 Linux 发行版自带 Python。如果你需要管理多个版本，`pyenv` 是神器：

```bash
# 安装特定版本
pyenv install 3.10.12
# 在当前文件夹切换版本（仅对当前目录有效，不影响系统）
pyenv local 3.10.12
```

- **便利点：** **“目录级”的版本控制**。你可以让项目 A 用 Python 3.8，项目 B 用 3.12，进入文件夹后版本自动切换，完全不会出现 Windows 上那种 `python` 和 `python3` 命令打架的情况

---

## Go环境

Go 语言虽然在 Windows 上也有安装包，但配置 `GOPATH` 和 `GOROOT` 曾是很多人的噩梦

- **Linux 的做法：** 除了包管理器，Go 在 Linux 下通常只需解压到 `/usr/local` 即可。更方便的是使用 `snap` 或 `asdf`：

```sh
sudo snap install go --classic
```

- **便利点：** Go 的交叉编译在 Linux 下表现极佳。由于 Linux 环境本身就是服务器的标准环境，你在 Linux 下编译出的二进制文件，丢到服务器上直接就能跑，不需要担心像 Windows 编译时可能带入的特定 DLL 依赖问题
