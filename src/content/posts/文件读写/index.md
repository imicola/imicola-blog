---
title: 文件读写
published: 2026-03-07
pinned: false
description: Go语言文件读写操作详解
tags: [Go]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-03-07
pubDate: 2026-03-07
---

# 文件读写

## 小文件

如果你能确定你读取的文件或者你写入的数据量，那么你可以使用 `os` 提供的 `ReadFile` 和 `WriteFile` 函数

```go
// 文件读入
data,err := os.ReadFile("example.txt")
if err != nil{
	log.Fatal(err)
}
fmt.Println(string(data))

// 文件写出
content := []byte("Hello Go")
err := os.WriteFile("out.txt",content,0644)
if err != nil{
	log.Fatal(err)
}
```

## 逐行或按块处理

- 使用 `bufio.Scanner` 逐行读取

```go
file , err := os.Open("large_file.txt")
if err != nil{
	log.Fatal(err)
}
defer file.Close() //注意关闭文件

scanner := bufio.NewScanner(file)
for scanner.Scan(){
	string s = scanner.Text()
	// 处理
}
if err := scanner.Err(); err != nil{
	log.Fatal(err)
}
```

## 文件的写入操作

如果你需要对文件进行更精细的控制（比如追加内容），需要使用 `os.OpenFile`。

### 追加内容到文件

```Go
// O_APPEND: 追加模式, O_CREATE: 如果不存在则创建, O_WRONLY: 只写模式
file, err := os.OpenFile("log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
if err != nil {
    log.Fatal(err)
}
defer file.Close()

if _, err := file.WriteString("New log entry\n"); err != nil {
    log.Fatal(err)
}
```

### 使用 `bufio.Writer` 提高性能

在频繁进行小量写入时，使用缓冲区可以显著减少系统调用，提升性能。

```Go
writer := bufio.NewWriter(file)
writer.WriteString("Buffered string")
writer.Flush() // 必须调用 Flush 确保数据从缓冲区写入磁盘
```
