---
title: 基础知识
published: 2026-03-28
description: 这是docker 系列文章的第三期喵
image: ./cover.webp
tags:
  - docker
category: 技术
draft: false
lang: zh-CN
pinned: false
comment: true
author: imicola
licenseName: CC BY 4.0
aiLevel: 0
encrypted: false
password: imicola
---

# 容器

试想一下，假如你正在和团队一起开发一个Web应用，主要有三个组件构成—— 一个 React 前端，一个 Python API 和一个 PostgreSQL 数据库，如果你想在这个项目上工作，你就必须安装 Node,Python 和 PostgreSQL

那我们如何确保自己和团队中的其他开发人员使用相同的版本？或者如何保证我们的 CI/CD 系统相同？或者生产环境中使用的版本相同?

这个时候我们就可以选择进入容器

什么是容器？简单来说，容器是为我们的应用程序的每个组件提供的隔离进程。每个组件——前端 React 应用程序、Python API 引擎和数据库——都在其自己的独立环境中运行，与您机器上的其他所有内容完全隔离。

一般来说容器具有以下特点:
- **自包含** : 每个容器都有其所运行需要的一切，不依赖主机的任何依赖
- **隔离**：  每个容器都是在隔离状态运行的，降低其对主机和其他容器的影响
- **独立**:  每个容器都是独立管理的，删除一个容器不会影响其他容器
- **便携**:  容器可以在任何地方运行，在开发机器和服务器等地方都是以相同方式工作

---

## 容器实践

> 我们的实践都默认在 CLI 环境下进行，这是为了更好的适应 Shell环境和服务器环境，当然如果一个工作可以在vscode远程链接上使用，我们也会讲。~~绝对不是imicola是用wsl的~~

### 启动第一个容器

打开命令行终端输入:

```sh
docker run -d -p 8080:80 docker/welcome-to-docker
```

> [!tip]- 命令的解析  
> 在这个命令中， `docker run` 是一个复合命令，其结合了 `docker create` 和 `docker start` 两个命令，同时一些参数表示如下：
> - `-d` 表示后台运行，不加这个参数会让docker输出日志而不是返回终端环境，此时如果按下 <Ctrl-c> 会导致容器终止
> - `-p 8080:80` 表示将本机8080端口映射到docker的80端口上

此时我们便完成了第一个容器的启动

### 查看正在运行的容器

要想查看正在运行的容器，我们可以使用 `docker ps` 命令，这个命令会输出所有正在运行的容器

我们将会看到类似的输出：

```sh
 CONTAINER ID   IMAGE                      COMMAND                  CREATED          STATUS          PORTS                      NAMES
 a1f7a4bb3a27   docker/welcome-to-docker   "/docker-entrypoint."   11 seconds ago   Up 11 seconds   0.0.0.0:8080->80/tcp       gracious_keldysh
```

这个容器运行的是一个简单的web服务器，当我们处理更复杂的项目的时候，我们会在不同的容器中运行不同的部分

### 访问前端

当我们启动容器之后，我们便将容器的一个端口暴露在我们的机器上，对于这个容器，我们可以用 [http://localhost:8080](http://localhost:8080/) 来访问

### 关闭容器

要关闭一个容器，我们可以使用 `docker stop` 命令，这个命令需要使用容器的ID，使用 `docker ps` 获取即可

> [!Tip]+  
> 当我们通过ID引用容器的时候，不需要提供完整的ID，只需要提供足够多的ID部分保证其唯一性即可，如我们可以使用 `docker stop a1f` 来停止我们的示例容器

# 镜像

如果说容器是一个隔离的进程，那它会从什么地方获取文件和配置，又如何共享这些环境？这便是容器镜像发挥作用的地方

容器镜像是一个标准化的软件包，包含了运行容器所需的一切文件、运行库和配置

镜像有两个重要的原则:
- 镜像是不可变的，一旦镜像被创建就无法修改它，你只能创建新的镜像或者在原有的镜像上添加更改
- 容器镜像由层组成，每一层代表一组文件系统更改，这些更改可以添加，删除，或者修改文件

这两个原则让我们可以扩展现有镜像或在现有镜像基础上添加内容。例如，我们正在构建一个 Python 应用程序，我们可以从 [Python 镜像](https://hub.docker.com/_/python) 开始，并添加额外的层来安装您应用程序的依赖项并添加代码。这使我们可以专注于我们的应用程序，而不是 Python 本身。

## 镜像实践

### 搜索并下载镜像

我们可以用 `docker search` 命令搜索镜像:

```sh
docker search docker/welcome-to-docker
```

此时我们将看到类似的输出，这个输出向我们展示有关 Docker Hub 上可用相关镜像的信息

然后，我们可以使用 `docker pull` 拉取镜像，就如同使用 `git clone` 拉取仓库一般

### 了解镜像

使用 `docker image ls` 命令可以列出我们已经下载的镜像，使用 `docker image history` 命令可以列出镜像的层

我们会看到类似的输出：

```sh
IMAGE          CREATED        CREATED BY                                      SIZE      COMMENT
648f93a1ba7d   4 months ago   COPY /app/build /usr/share/nginx/html # buil...  1.6MB     buildkit.dockerfile.v0
<missing>      5 months ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon...  0B
<missing>      5 months ago   /bin/sh -c #(nop)  STOPSIGNAL SIGQUIT           0B
<missing>      5 months ago   /bin/sh -c #(nop)  EXPOSE 80                    0B
<missing>      5 months ago   /bin/sh -c #(nop)  ENTRYPOINT ["/docker-entr...  0B
<missing>      5 months ago   /bin/sh -c #(nop) COPY file:9e3b2b63db9f8fc7...  4.62kB
<missing>      5 months ago   /bin/sh -c #(nop) COPY file:57846632accc8975...  3.02kB
<missing>      5 months ago   /bin/sh -c #(nop) COPY file:3b1b9915b7dd898a...  298B
<missing>      5 months ago   /bin/sh -c #(nop) COPY file:caec368f5a54f70a...  2.12kB
<missing>      5 months ago   /bin/sh -c #(nop) COPY file:01e75c6dd0ce317d...  1.62kB
<missing>      5 months ago   /bin/sh -c set -x     && addgroup -g 101 -S ...  9.7MB
<missing>      5 months ago   /bin/sh -c #(nop)  ENV PKG_RELEASE=1            0B
<missing>      5 months ago   /bin/sh -c #(nop)  ENV NGINX_VERSION=1.25.3     0B
<missing>      5 months ago   /bin/sh -c #(nop)  LABEL maintainer=NGINX Do...  0B
<missing>      5 months ago   /bin/sh -c #(nop)  CMD ["/bin/sh"]              0B
<missing>      5 months ago   /bin/sh -c #(nop) ADD file:ff3112828967e8004...  7.66MB
```

此输出显示所有层,他们的大小以及创建该层的命令

而对于构建镜像的知识我们会在后面的文章中详细介绍

# 注册表与镜像仓库

既然我们已经知道了什么是容器以及镜像，简洁的说镜像就如同git仓库项目一般，那么既然是一个项目，必然有其存储的地方

我们当然可以在我们的计算机中存储我们的容器镜像，但是如果我们需要分享或者需要协同工作呢？此时我们就需要镜像仓库

镜像仓库是存储和共享容器的集中位置，其可以是私有的或公共的。[Docker Hub](https://hub.docker.com/) 就是一个任何人都可以使用的公共仓库:spoiler[我看未必]，也是默认的仓库

除了Docker Hub以外，我们也有许多的容器注册表，包括 
- [Amazon Elastic Container Registry(ECR)](https://aws.amazon.com/ecr/)
- [Azure Container Registry (ACR)](https://azure.microsoft.com/en-in/products/container-registry)
- [Google Container Registry (GCR)](https://cloud.google.com/artifact-registry)
- [Alibaba Cloud Container Registry(ACR)](https://help.aliyun.com/zh/acr/)
- [GitHub Container Registry(GHCR)](https://docs.github.com/zh/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 注册表实践

:spoiler[对于中国用户而言,下载 Docker 注册表镜像和上传是有些限制的,在之前可以使用镜像来解决这些问题，但是目前来看镜像站已经被wall完了,所以需要下面内容默认你会使用魔法]

### 注册Docker Hub账户并且创建仓库

如果你还没有创建账户，请前往 [Docker Hub](https://hub.docker.com/) 页面注册一个新的 Docker 账户。

之后选择创建仓库 (Create a Repository)并按需求填入名称，描述与可访问性

> [!tip]- 关于可访问性  
> docker 对个人用户相当慷慨，为免费用户提供无限的公开仓库创建权限和单个私人仓库创建权限，对于个人开发者，这完全足够，如果你需要更多的私人仓库，可以选择升级Plan或者使用GHCR

### 创建并推送镜像

> 创建镜像一般会编写Dockerfile，这个知识我们将在后面的内容中了解

如果你是Docker Desktop用户，你需要先登录Docker Desktop然后按下面的方法来推送镜像

1. 运行以下命令来构建 Docker 镜像，将 `YOUR_DOCKER_USERNAME` 替换为您的用户名，将 `DOCKER-NAME` 改为你的容器名称

```sh
docker build -t <YOUR_DOCKER_USERNAME>/<DOCKER-NAME> .
```

2. 运行`docker image ls`命令以列出新创建的 Docker 镜像
3. 通过运行`docker run -d -p 8080:8080 <YOUR_DOCKER_USERNAME>/<DOCKER-NAME>` 命令启动容器以测试镜像
4. 使用 [`docker tag`](https://docker.cadn.net.cn/reference/cli_docker_image_tag) 命令来标记 Docker 镜像。Docker 标签允许您对镜像进行标记和版本控制

```sh
docker tag <YOUR_DOCKER_USERNAME>/<DOCKER-NAME> <YOUR_DOCKER_USERNAME>/<DOCKER-NAME>:1.0 
```

5. 最后，通过使用 [`docker push`](https://docker.cadn.net.cn/reference/cli_docker_image_push) 命令将新构建的镜像推送到您的 Docker Hub 仓库：
```sh
docker push <YOUR_DOCKER_USERNAME>/<DOCKER-NAME>:1.0
```

这样你就成功将一个镜像推送到了Docker Hub中

> [!note]- 那对于不使用docker desktop的用户呢？
> 
> 我们一般会使用 Docker Engine自带的命令行工具来完成镜像的推送与拉取
> 
> 首先你需要登录仓库，使用 `docker login` 命令登录docker hub，如果是私有仓库 `docker login <仓库地址>`
> 
> 之后也是使用 `docker tag` 为镜像打标签，再使用 `docker push` 命令推送镜像即可
