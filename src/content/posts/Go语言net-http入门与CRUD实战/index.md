---
title: Go net/http 从入门到 CRUD 实战
published: 2026-09-04
pinned: false
description: 从一个 GET /healthz 请求的完整链路出发，梳理 net/http 的核心组件与 HTTP Method 语义，再基于 Go 1.22 的方法路由实现一套完整的 RESTful CRUD 服务。
tags: [Go, HTTP]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-09-04
pubDate: 2026-09-04
image: "./cover.jpg"
aiLevel: 1
---

# 从一个请求的链路开始

当我们从客户端向服务器发送 HTTP 请求的时候，Go 语言有一套专门负责解析、构造的标准库 `net/http`。本文先从一个简单的 `GET /healthz` 实例引入 HTTP Server，接着梳理 HTTP Method 的语义，最后基于 Go 1.22 的方法路由实现一套完整的 CRUD 服务。

## HTTP 服务链路

假设我们的客户端构造一个 8080 端口的 `GET /healthz` 请求，而服务端需要返回 `HTTP 200 OK`，这其中基本的链路如下：

```txt
客户端连接 8080 端口
→ Go HTTP Server 读取并解析 HTTP 请求
→ 路由器根据请求路径寻找 Handler
→ /healthz 匹配到 healthz 函数
→ healthz 读取请求 r
→ 通过 w 写回响应
```

想要完成上面的链路，需要涉及如下的方法：

- `net/http.ListenAndServe`
- `net/http.HandleFunc`
- `net/http.HandlerFunc`
- `net/http.ResponseWriter`
- `net/http.Request`

我们接下来逐一讲解这些基本方法。

### HandleFunc

```go
func http.HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
```

`HandleFunc` 是注册函数，负责在默认路由器中把 `pattern` 表示的路径与 `handler` 函数关联起来。

例如：

```go
http.HandleFunc("/healthz", healthz)
```

表示将 `/healthz` 与函数 `healthz` 绑定并且注册到默认路由器中。这个操作并不会直接进入 `healthz` 函数中，真正的调用发生在请求到达之后。

### ListenAndServe

```go
func http.ListenAndServe(addr string, handler http.Handler) error
```

这个函数接受一个 TCP 地址，例如 `IPv4:Port`。本地测试时可以写成 `:Port`，其中省略的是具体主机地址，通常表示监听本机所有可用网络接口，并不等同于只监听 `localhost`；客户端仍可使用 `localhost:Port` 访问。

这个函数的作用是启动一个 HTTP Server，在第一个参数指定的地址上监听，并把收到的请求交给第二个参数代表的 Handler 处理。

- 这里有一点需要注意的是，当我们没有手写 mux 的时候这里可以填入 `nil`，这代表请求会被 `DefaultServeMux` 处理。

### HandlerFunc

`HandlerFunc` 是标准库定义的命名函数类型。

```go
type HandlerFunc func(ResponseWriter, *Request)
```

`HandlerFunc` 实现了 `Handler` 接口，可以把签名匹配的普通函数适配为 HTTP Handler。原始 HTTP 数据到 `Request` 对象的解析由 HTTP Server 完成，在进入 Handler 前已经完成。

### Request

在函数内部，`Request` 不负责执行底层解析，而是让我们读取解析后的请求信息。

其常见的内容如下：

```go
r.Method      // GET、POST 等请求方法
r.URL         // 路径和查询参数
r.Header      // 请求头
r.Body        // 请求体
r.Context()   // 请求上下文和取消信号
```

### ResponseWriter

`ResponseWriter` 可以理解为你向客户端写回 HTTP 响应的出口。

对于一个 HTTP 响应，主要分为三部分：

```http
HTTP/1.1 200 OK                   → 状态行
Content-Type: application/json    → 响应头

{"status":"ok"}                   → 响应体
```

因此，代码中的函数应该围绕构建这三个部分进行：

```go
w.Header().Set(...) // 设置响应头
w.WriteHeader(...)  // 设置响应状态码
w.Write(...)        // 写入响应体
```

对于这三个函数，顺序是非常重要的，因为一旦调用 `WriteHeader` 或 `Write` 后响应头通常就已经被发送（go 会自动发送 `200 OK`）。

> [!note] 响应头
> HTTP 响应头是一组键值形式的**元数据**，用于描述响应，而不是响应的实际内容。
>
> 例如：
> ```http
> Content-Type: application/json
> Content-Length: 15
> Cache-Control: no-cache
> Allow: GET
> ```
> 其中 `Content-Type` 的含义是告诉客户端响应体应该按什么格式解析。

## 第一个完整的例子

所以对于实现一个简单的 `GET /healthz` 监听响应程序，我们可以这样书写代码：

```go
package main

import (
	"log"
	"net/http"
)

func healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	http.HandleFunc("/healthz", healthz)
	log.Println("Server start ok")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
		return
	}
}
```

# 理解 HTTP Method

在动手实现 CRUD 之前，需要先建立对 HTTP Method 的准确认识，理解 Method 与 CRUD 的映射关系。

## Method 是什么

先建立最基础的模型。从语义层面看，一个 HTTP Request 可以先关注：

```text
Method + Path + Header + Body
```

其中 `Method` 可以先理解为客户端希望对目标资源执行的动作。例如 `GET /targets/1` 表示请求读取 `/targets/1` 所标识的资源。

HTTP Method 和 CRUD 有常见对应关系，但两者并非严格等价。例如 POST 也可以表示提交任务或触发处理，并不一定创建资源。

```text
GET        → Read
POST       → Create（常见用法之一）
PUT/PATCH  → Update
DELETE     → Delete
```

## GET

GET 表示获取资源的当前表示。例如 `GET /targets` 通常读取 Target 集合，而 `GET /targets/1` 读取 ID 为 1 的单个 Target。

假设服务器中存在：

```text
Target: 1
name = "google"
address = "https://google.com"

Target: 2
name = "github"
address = "https://github.com"
```

请求 `GET /targets` 时，服务器可以返回 JSON 数组：

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "name": "google",
    "address": "https://google.com"
  },
  {
    "id": 2,
    "name": "github",
    "address": "https://github.com"
  }
]
```

如果请求 `GET /targets/1`，则只返回 ID 为 1 的资源；资源不存在时通常返回 `404 Not Found`。

GET 是安全且幂等的方法："安全"表示客户端请求的目标不是修改服务器状态；"幂等"表示多次相同请求的预期效果与一次相同。

## POST

POST 表示客户端向目标资源提交数据，请服务器按照该资源的语义进行处理。在本项目中，它用于向集合创建一个新 Target：

```http
POST /targets
Content-Type: application/json

{
  "name": "google",
  "address": "https://google.com"
}
```

创建成功后通常返回 `201 Created` 和创建后的资源，也可以通过 `Location` 响应头告诉客户端新资源的 URI。

设计资源风格的 API 时，一般使用 `POST /targets`，而不是 `POST /createTarget`，因为 Method 已经表达了操作语义。不过这是一种常见 API 设计方式，不是 HTTP 协议强制规定。

POST 通常不是幂等方法：重复发送同一个创建请求，可能创建多个不同资源。

## PUT

PUT 通常表示：

> 用客户端提供的完整表示替换目标资源的当前表示。

例如客户端发送：

```http
PUT /targets/1
Content-Type: application/json

{
  "name": "google",
  "address": "https://google.com"
}
```

则服务器中的资源会被完整替换为：

```json
{
  "id": 1,
  "name": "google",
  "address": "https://google.com"
}
```

PUT 是幂等方法：多次发送相同 PUT 请求，其预期服务器状态与发送一次相同。在 `sentinel-go` 当前约定中，更新不存在的 ID 返回 `404 Not Found`；HTTP 标准也允许某些 API 使用 PUT 创建指定 URI 的资源，因此具体行为需要在接口契约中写清楚。

## PATCH

PATCH 也表示更新。与 PUT 的完整替换不同，PATCH 请求体描述要应用到资源的一组局部修改，因此通常只提供需要变化的字段。

例如客户端发送：

```http
PATCH /targets/1
Content-Type: application/json

{
  "name": "bing"
}
```

更新后的资源可能是：

```json
{
  "id": 1,
  "name": "bing",
  "address": "https://google.com"
}
```

PUT 和 PATCH 成功后可以返回更新后的资源和 `200 OK`，也可以在不返回正文时使用 `204 No Content`；具体选择应保持一致并写入接口契约。PATCH 不保证天然幂等，其幂等性取决于补丁格式和操作语义。

## DELETE

DELETE 用于删除目标资源。当客户端发送 `DELETE /targets/{id}` 时，就是请求删除该 ID 对应的 Target；成功且不返回正文时通常使用 `204 No Content`，资源不存在时通常返回 `404 Not Found`。

DELETE 是幂等方法。这里的"幂等"指多次相同请求的预期服务器状态与执行一次相同，而不是要求每次响应状态码完全相同；第一次删除可能返回 `204`，再次删除可能返回 `404`。

## 安全性与幂等性速查

| Method | 安全 | 幂等 | 项目中的常见用途 |
| --- | --- | --- | --- |
| GET | 是 | 是 | 查询 Target |
| POST | 否 | 通常否 | 创建 Target |
| PUT | 否 | 是 | 完整替换 Target |
| PATCH | 否 | 不一定 | 局部修改 Target |
| DELETE | 否 | 是 | 删除 Target |

# 动手实现 CRUD

理解了请求链路和 Method 语义之后，就可以在 `net/http` 的基础上，根据 HTTP Method 对资源执行创建、读取、更新和删除操作。在开始 CRUD 之前，需要先理解路由器的选择。

## 自定义路由器

最简单的例子使用了 `http.ListenAndServe(":8080", nil)`。其中第二个参数为 `nil` 时，服务器会使用全局的 `http.DefaultServeMux`。我们也可以显式创建并传入自己的路由器：

```go
mux := http.NewServeMux()
mux.HandleFunc("/healthz", healthz)
http.ListenAndServe(":8080", mux)
```

这样，请求链会更加清晰：

```text
客户端
  │
  │ GET /healthz
  ↓
HTTP Server（读取并解析请求）
  │
  ↓
mux（根据 Method + Path 匹配 Handler）
  │
  ↓
healthz
  │
  ↓
ResponseWriter
  │
  ↓
客户端
```

这里需要注意：如果路由通过 `http.HandleFunc` 注册，它会进入 `DefaultServeMux`；如果服务器最终使用的是新建的 `mux`，请求就匹配不到这些路由。因此，注册路由和启动服务器必须使用同一个 `ServeMux`。

## Go 1.22 之后的方法路由

在一些旧教程中，我们会看到下面的写法：

```go
mux.HandleFunc("/targets", targetsHandler)

func targetsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		// 查询
	case http.MethodPost:
		// 创建
	default:
		// 405
	}
}
```

从 Go 1.22 开始，标准库 `ServeMux` 的 pattern 支持 Method 和路径通配符，因此可以写成：

```go
mux.HandleFunc("GET /targets", listTarget)
mux.HandleFunc("POST /targets", addTarget)

mux.HandleFunc("GET /targets/{id}", getTarget)
mux.HandleFunc("PUT /targets/{id}", updateTarget)
mux.HandleFunc("DELETE /targets/{id}", deleteTarget)
```

本文示例统一使用复数资源路径 `/targets`，而当前 `sentinel-go` 代码仍使用 `/target`。两种路径都能被路由器处理，但同一个项目应统一代码、README、测试和笔记中的接口契约，避免调用时混用。

HTTP Server 负责读取并解析原始请求，`ServeMux` 接收解析后的 `*http.Request`，再根据 Method、Host 和 Path 选择 Handler。换句话说，`ServeMux` 是请求多路复用器，而不是 HTTP 报文解析器。

`{id}` 只匹配一个路径段，可以通过 `r.PathValue("id")` 读取，返回值类型是 `string`。另外，`"GET /targets/{id}"` 也会匹配 `HEAD` 请求；当 Path 能匹配、Method 不能匹配时，`ServeMux` 会返回 `405 Method Not Allowed`。

## 处理路径参数：ID 问题

`r.PathValue()` 返回字符串。如果资源 ID 使用整数表示，就需要进行转换，并将转换失败视为客户端请求错误：

```go
id, err := strconv.Atoi(r.PathValue("id"))
if err != nil {
	http.Error(w, "invalid id", http.StatusBadRequest)
	return
}
```

`PathValue` 读取的是 `ServeMux` 已匹配路径通配符的值。例如路由 pattern 为 `"GET /targets/{id}"` 时，请求 `/targets/12` 得到的 `id` 是字符串 `"12"`。如果请求没有经过包含该通配符的路由匹配，结果会是空字符串。

生成 ID 时不能简单使用 `len(targets) + 1`，因为删除中间元素后，新 ID 可能与仍然存在的 ID 冲突。当前练习可以维护独立的递增计数器；并发处理请求时，计数器和 map 必须放在同一套同步策略下保护。

## 如何返回 JSON

可以使用标准库中的 `json.NewEncoder(w).Encode(value)` 构造 JSON 响应，并通过结构体标签控制字段名称：

```go
type Target struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Addr string `json:"address"`
}
```

写入正文前需要设置响应头和状态码：

```go
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
if err := json.NewEncoder(w).Encode(value); err != nil {
	// 记录错误；响应提交后不能再修改状态码。
}
```

第一次调用 `WriteHeader`，或者第一次写入响应体时，HTTP 状态码就会提交。状态码提交后再调用 `http.Error`，不能把已经发送的 `200` 改成 `500`。如果必须保证"编码失败时返回 500"，可以先用 `json.Marshal` 在内存中完成编码，成功后再写响应头和正文。

当需要返回多个资源时，可以先构造切片，再编码成 JSON 数组：

```go
list := make([]Target, 0, len(targets))
for _, target := range targets {
	list = append(list, target)
}

if err := json.NewEncoder(w).Encode(list); err != nil {
	// 记录错误
}
```

## 如何解析 JSON

请求体可以通过 Decoder 解析到结构体中：

```go
var req TargetRequest

if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
	http.Error(w, "invalid json", http.StatusBadRequest)
	return
}
```

这里需要传入 `&req`，因为 Decoder 必须修改调用方持有的变量，才能把解析结果写入结构体字段。解析和校验通过后，再构造资源并写入服务器的存储：

```go
target := Target{
	ID:   nextID,
	Name: req.Name,
	Addr: req.Addr,
}

targets[nextID] = target
```

## 拒绝未知字段与业务校验

如果希望拒绝目标结构体中不存在的 JSON 字段，可以使用：

```go
var req TargetRequest
decoder := json.NewDecoder(r.Body)
decoder.DisallowUnknownFields()

if err := decoder.Decode(&req); err != nil {
	http.Error(w, "invalid json", http.StatusBadRequest)
	return
}
```

`DisallowUnknownFields` 只负责拒绝未知字段，不会判断缺失字段、空字符串或地址是否合法；这些业务规则仍需单独校验。`Decode` 本身会报告 JSON 语法错误和类型不匹配。

```go
if req.Name == "" || req.Addr == "" {
	http.Error(w, "name and address are required", http.StatusBadRequest)
	return
}
```

只调用一次 `Decode` 还可能接受正文末尾的第二个 JSON 值。需要严格限制请求正文时，可以在第一次解析成功后再次解析并确认得到 `io.EOF`，同时根据服务边界考虑限制请求体大小。

## map 中的结构体是值副本

当 `targets` 的类型是 `map[int]Target` 时，下面读取出的 `target` 是结构体副本：

```go
target, ok := targets[id]
```

修改副本后必须显式写回：

```go
target.Name = req.Name
target.Addr = req.Addr
targets[id] = target
```

否则 PUT 响应可能返回新值，但后续 GET 仍然读到旧值。

## Handler 中不要调用 log.Fatal

非法 ID、非法 JSON 和资源不存在都只是一次请求的失败，不应终止整个服务器。`log.Fatal` 记录日志后会调用 `os.Exit(1)`，因此 Handler 应返回合适的 `4xx`；服务器内部错误一般记录日志并返回 `500`。

## 当前实现边界

当前 `sentinel-go` 使用内存 `map` 保存 Target，因此服务重启后数据会丢失。`net/http` 会并发处理请求，而普通 `map` 与自增 ID 计数器不能安全地被多个请求同时读写；后续需要引入互斥保护并使用 `go test -race` 验证。自动化测试、服务超时和优雅退出也尚未完成。

# 参考资料

- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 5789：PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789.html)
- [Go 1.22 Release Notes](https://go.dev/doc/go1.22)
- [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements)
- [`net/http` package documentation](https://pkg.go.dev/net/http)
