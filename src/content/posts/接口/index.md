---
title: 接口
published: 2026-07-04
pinned: false
description: Go语言接口的设计与实践
tags: [Go]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-07-04
pubDate: 2026-07-04
---

# 语法

我们使用 `type [接口名称] interface{}` 来声明一个接口

```go
type Sayer interface {
	Say(messge string) error
}
```

当我们需要实现一个接口的继承的时候，我们可以直接实现这个接口里的方法

```go
type Dog struct {
    name string
}

func (dog *Dog)Say(messge string) error{
	fmt.println(dog.name + "说：" + messge)
	return nil
}

// 在实现的时候我们可以
var sa Sayer
d := &Dog{"name"}
sa = d
sa.Say()       //接口可以调用d的方法了，此时我们实现了接口
```

# 工程约束

- 命名约定：
  - 单一方法接口：以`er`结尾，例如`Reader`,`Writer`
  - 不要预先定义：接口应该由使用者定义，而不是生产者定义
- 接口设计：**越小越好**
	- Go语言鼓励组合小接口而不是去创建一个庞大的接口
- 接受接口，返回结构体
	- 在设计一个函数的时候，应该尽量接受接口，以提高函数的通用性
	- 函数应该返回具体的结构体


# 接口能干什么

下面我们用一个简单的需求展现`interface`的功能
## 需求描述：多渠道告警系统

> 我们的任务是编写一个告警小程序。这个程序需要支持多种通知方式（如邮件、短信），并且要能够轻松扩展新的通知方式（比如以后要加一个“钉钉告警”），而不需要修改核心的业务逻辑代码。

1. 接口定义:  
	定义一个名为 Notifier 的接口，它必须包含一个方法：`Notify(message string) error`

2. 具体实现  
	实现两个结构体，并让它们都满足 Notifier 接口：
 > `EmailNotifier`: 结构体里包含一个 `Address` 字段。调用 `Notify` 时，打印：“向邮件地址 \[xxx] 发送了消息：\[内容]”。  
 > SMSNotifier: 结构体里包含一个 PhoneNumber 字段。调用 Notify 时，打印：“向手机号 \[xxx] 发送了短信：\[内容]”。

3. 核心业务逻辑（关键点）  
	编写一个函数 `SendAlerts`：  
	- 参数：接受一个 Notifier 接口的切片（[]Notifier）和一条消息字符串。
	- 功能：循环遍历切片，调用每个元素的 Notify 方法。


**在 main 函数中：**

- 创建一个包含一个 `EmailNotifier `和一个 `SMSNotifier` 的切片。
- 调用 `SendAlerts` 函数，把这个切片传进去。  
进阶思考:  
> 如果现在想增加一个 WeChatNotifier，你是否需要修改 SendAlerts 函数的代码？

---
参考：
```go
package main

import (
	"fmt"
)

type Notifier interface {
	Notify(message string) error
}

type EmailNotifier struct {
	Address string
}

type SMSNotifier struct {
	Phonenumber string
}

func (emi *EmailNotifier) Notify(message string) error {
	fmt.Println("向邮件地址" + emi.Address + "发送了信息:" + message)
	return nil
}

func (sms *SMSNotifier) Notify(message string) error {
	fmt.Println("向手机号" + sms.Phonenumber + "发送了信息" + message)
	return nil
}

func SendAlerts(notify []Notifier) error {
	for _, n := range notify {
		n.Notify("Testmessage")
	}
	return nil
}

// 新增WeChatNotifier
type WeChatNotifier struct {
	WechatID string
}

func (wec *WeChatNotifier) Notify(message string) error {
	fmt.Println("向微信号:" + wec.WechatID + "推送：" + message)
	return nil
}

func main() {
	nois := []Notifier{&EmailNotifier{"test1"}, &SMSNotifier{"test2"}}
	SendAlerts(nois)
	nois = append(nois, &WeChatNotifier{"test3"})
	SendAlerts(nois)
}
```
