---
title: 多线程与并发
published: 2026-02-04
pinned: false
description: Go语言并发编程：Goroutine、Channel 与 GMP 调度模型
tags: [Go, 并发]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-02-04
pubDate: 2026-02-04
---

***不要通过共享内存来通信，而要通过通信来共享内存***

# 概念明晰

在深入了解并发前我们需要了解一些关于多线程和并发编程中常见的概念
- 并发：是指你的程序有**处理**多个任务的能力。在一个单核 CPU 上，通过快速切换任务，看起来像是同时在做很多事，但实际上某一时刻只有一个任务在运行。
- 并行：是指你的程序有**同时执行**多个任务的能力。这需要多核 CPU 的硬件支持，让不同的任务真正地在不同的核心上同时运转。

同时在我们需要了解一下 进程，线程和协程三者的区别

|  **特性**  | **进程 (Process)** | **线程 (Thread)** | **协程 (Goroutine)**    |
| :------: | :--------------- | :-------------- | :-------------------- |
| **拥有者**  | 操作系统             | 操作系统            | Go 运行时 (Runtime)      |
| **内存占用** | 很大 (MB 级别)       | 较大 (~1MB)       | 极小 (初始仅 2KB)          |
| **切换开销** | 极高 (内核态切换)       | 高 (涉及寄存器保存)     | 极低 (用户态切换)            |
| **通信方式** | IPC (管道、信号量)     | 共享内存 (需加锁)      | **Channel (推荐)**、共享内存 |

---

# Goroutine

## 语法

在Go语言中开启一个并发任务十分简单，只需要在函数之前添加一个 `go` 关键字

```go
go function(params)
```

底层逻辑：
- 非阻塞：调用后，主程序会立即向下执行，不会等待 `doSomething` 返回。
- 匿名函数：常用 `go func() { ... }()` 的形式开启，但要注意**闭包捕获变量**的坑（在循环中直接使用循环变量可能会导致所有协程引用同一个值）。

## 生命周期管理

协程虽然轻量，但是对于其的生命周期管理也是必须的，如果管理不当，会导致 **Goroutime泄露** 问题

生命周期：
- **启动** : 通过 `go` 关键字
- **运行** : 由GMP调度器分配到逻辑处理器上
- **退出** ：
	1. 函数体执行完毕
	2. main函数结束
	3. 发生不可恢复的 `panic`

## GMP模型

在Go语言协程调度中有三个关键角色

| **角色** | **全称**    | **作用**                                       |
| ------ | --------- | -------------------------------------------- |
| G      | Goroutine | 协程。包含栈内存、指令指针等。它不直接运行，而是被调度的单位。              |
| M      | Machine   | 操作系统线程（OS Thread）。它是真正的执行单元。M 必须绑定 P 才能运行 G。 |
| P      | Processor | 逻辑处理器。它像一个“入场券”和“资源桶”，维护着一个本地待运行的 G 队列。      |

调度全景：
1. 我们执行 `go func()` 产生一个G
2. G优先放入当前 P 的本地队列，如果本地满了，才放入全局队列
3. M 获取一个 P，然后从P的本地队列中取出G执行
4. 如果本地队列、全局队列都空了，M 就会启动 Work Stealing 从其他 P 偷任务。

# Channel

Channel可以翻译成通道，和linux下的[[Shell#^shttyz|pipe]]不同，Go语言中是我们可以看作是一个有类型的管道

## 语法

channel的使用符号为`<-`，我们可以将其看作数据流动的方向

- 创建Channel：

```go
// 创建一个传递整型的管道
ch := make(chan int)

// 创建一个转递字符串的管道，并且带有3个容量的缓冲区
ch1 := make(chan string,3)
```

- 发送数据

```go
ch <- 100   //将数字100发送到管道ch中
```

- 接受数据

```go
data := <- ch   //从管道中取出一个值并且赋值给 data
```

- 关闭管道：  
这是用来通知接收方以后没有数据进来了

```go
close(ch)
```

## 阻塞

管道的发送和接受收到 *阻塞* 的约束
- **发送阻塞**：如果你往管道里塞东西，但没人接，你就会在那儿**等着（阻塞）**，直到有人来拿。
- **接收阻塞**：如果你从管道里取东西，但里面是空的，你也会在那儿**等着（阻塞）**，直到有人塞进一个东西。  
需要注意的是有缓冲管道和无缓冲管道的阻塞情况不同
- 无缓冲管道要求管道的接受和发送都必须同步，否则就会一直阻塞
- 有缓冲管道会在管道满或空的时候发生阻塞

---

## select多路复用

我们在处理多个协程通信的时候可以使用`select`来帮助我们

`select` 看起来像 `switch`，但它是专门为通道设计的，它会**伪随机的**选择一个可运行的 case 执行。

```go
ch1 := make(chan int, 1)
ch2 := make(chan int, 1)

ch1 <- 1
ch2 <- 2

select {
case v1 := <-ch1:
    fmt.Println("执行了 ch1:", v1)
case v2 := <-ch2:
    fmt.Println("执行了 ch2:", v2)
}

fmt.Println("select 结束了")
```

我们如果想要实现处理所有数据，标准的做法是套上 `for`

```go
for {
    select {
    case v1 := <-ch1:
        fmt.Println("处理 ch1:", v1)
    case v2 := <-ch2:
        fmt.Println("处理 ch2:", v2)
    default:
        // 如果两个都没数据了，可以在这里退出循环或者做点别的
        fmt.Println("暂时没数据了")
        return 
    }
}
```

## Channel的实际使用

### 在匿名函数中使用

```go
func fu() {
	ch := make(chan int) 
	go func(){
		fmt.Println("ok")
		ch <- 1     // 发送数据
	}()
	<- ch	// 等待接受到数据
	fmt.Println("喵")
}
```

### 作为具体参数传入

```go
func downloader(url string, resultCh chan string) {
    // 模拟下载
    res := "下载完成: " + url
    resultCh <- res // 把结果发回管道
}

func main() {
    ch := make(chan string)
    // 启动具名函数
    go downloader("https://google.com", ch)
    fmt.Println(<-ch)
}
```

### 作为结构体的成员

当我们构建复杂系统的时候，channel通常是结构体的一部分，用来控制这个实例的状态或传递数据

```go
type Worker struct {
    ID     int
    JobCh  chan int    // 接收任务的管道
    QuitCh chan bool   // 接收停止信号的管道
}

func (w *Worker) Start() {
    go func() {
        for {
            select {
            case job := <-w.JobCh:
                fmt.Printf("工人 %d 正在处理任务 %d\n", w.ID, job)
            case <-w.QuitCh:
                fmt.Printf("工人 %d 关机下班\n", w.ID)
                return
            }
        }
    }()
}
```

### 工厂模式

作为一个函数的返回值用来创建一个管道并且启动一个协程往里面灌数据，然后将管道返回调用者

```go
func dataProducer() <-chan int {
    ch := make(chan int)
    go func() {
        for i := 0; i < 5; i++ {
            ch <- i
        }
        close(ch)
    }()
    return ch // 返回一个只读管道
}
```

---
