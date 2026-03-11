---
title: Go语言语法
published: 2026-02-04
pinned: false
description: Go语言语法介绍
tags: [语言特性, Go]
category: 技术
licenseName: "CC BY 4.0"
author: imicola
draft: false
date: 2026-02-04
# image: "./cover.jpg"
pubDate: 2026-3-11
---

# 语言特性

*less can be more*

这是go语言的核心思想

在go语言中，没有继承，多态，甚至是类

在go的文档中说Go语言几乎和C/C++一样快~~实则不然~~

# 语法

## 变量定义

在go语言中，主要采用类型后置的命名方式：

```go
var age int = 25 \\ 经典定义方式
var age = 25 \\ 自动推断，类似C++中 auto
age := 25 \\ 简短定义，等效上一条
```

在Golang中支持批量的定义

```go
var(
	a string
	b int
	c bool
	d float32
)
```

> 我们需要注意Golang的命名规则，**即首字母大写的命名在包外是可以访问的**
## 输入输出流(CLI下)

在go语言中，我们有两种对输入输出流进行控制的语法，分别是 `fmt` 包和 `bufio` 包

> [!tip]  
> 这两个包没有绝对的谁好谁坏的区别，对于`fmt`包而言，其适合格式化,对于 `bufio` 来说则更加侧重于性能

### `fmt`包的标准输入输出：

```Go
import (
	"fmt"
)

func main() {
	a := 114
	// 标准输出
	fmt.Print("hello go")       // 普通的打印
	fmt.Println("hello Gooooo") // 等效于在Print中加\n
	fmt.Printf("%d", a)         //  类似于C的printf
	// 标准输入
	fmt.Scan(&a) // 从标准输入中读取，注意需要传入地址
	var str string
	fmt.Scanln(&str)
	fmt.Println(a)
	fmt.Println(str)
}
```

### `bufio`的输入输出

```Go
func f2() {
	// 标准读入
	reader := bufio.NewReader(os.Stdin) // 创建一个输入流,类似于Java
	var x int
	var str string
	fmt.Fscan(reader, &x) // 搭配Fscan进行读入
	fmt.Fscan(reader, &str)
	// 标准输出
	writer := bufio.NewWriter(os.Stdout) // 创建一个输出流
	fmt.Fprintln(writer, x)
	fmt.Fprintln(writer, str)
	writer.Flush() // 必须要刷新缓冲区否则可能不会显示输出
}
```

## 基本数据类型

Golang的语言更加明确的数字类型命名

在go语言中，有以下几种基本的数据类型:
- 整型
- 浮点型
- 复数
- 布尔
- 字符串

### 整型

在go语言中整型可以分为两大类,其后面的数字表示了其占用的二进制位

|   无符号    |   有符号   |
| :------: | :-----: |
| `uint8`  | `int8`  |
| `uint16` | `int16` |
| `uint32` | `int32` |
| `uint64` | `int64` |

### 浮点型

go语言支持两种浮点型，`float32` 和 `float64`，不存在`double`

对于`float32`其范围大概为$3.4 \times 10^{38}$，`float64`的范围大约为$1.8 \times 10^{308}$,两个浮点数都有常量`Math.MaxFloat32 && Math.MaxFloat64`

### 复数

`complex32` 和 `complex64`  
其中后缀数字表示实部和虚部的位数

### 布尔

在go语言中我们用 `bool` 对布尔值进行声明

在Go语言中，没有1/0对布尔值的隐式转换，在建立布尔值的时候只能使用`true`或者`false`

布尔型无法参与数值运算，也无法与其他类型进行转换。

### 字符串

在go语言中，使用字符串和使用原生数据类型是一样的。在Golang的字符串内部使用的是UTF-8编码，所以我们可以直接使用非ASCII字符

```go
s1 := "hello"
s2 := "你好"
```

对于字符串而言有许多和其他语言一致的`\`转译字符

| 转义  |        含义         |
| :-: | :---------------: |
| \r  |     回车符（返回行首）     |
| \n  | 换行符（直接跳到下一行的同列位置） |
| \t  |        制表符        |
|  '  |        单引号        |
|  "  |        双引号        |
| \|  |        反斜杠        |

在go语言中也内置了和python一样好用的多行字符串

要实现一个多行字符串时，我们需要使用 `反引号` 字符 \`

```go
s1 := `第一行
第二行
第三行
`
```

反引号中的换行被作为字符串中的换行，所有的转义符号均无效，文本会原样输出

#### 字符串常用操作

Go语言的字符串是一个不可变字节序列，本身并不是一个类，但是Go提供了一些函数来处理字符串

查找与包含类：

| **功能**   | **方法**                         | **说明**                          |
| -------- | ------------------------------ | ------------------------------- |
| **是否包含** | `strings.Contains(s, substr)`  | 返回 `bool`，判断 `substr` 是否在 `s` 中 |
| **查找位置** | `strings.Index(s, substr)`     | 返回子串第一次出现的索引，不存在返回 `-1`         |
| **最后位置** | `strings.LastIndex(s, substr)` | 返回子串最后一次出现的索引                   |
| **前缀判断** | `strings.HasPrefix(s, prefix)` | 判断是否以某字符串开头                     |
| **后缀判断** | `strings.HasSuffix(s, suffix)` | 判断是否以某字符串结尾                     |
| **统计次数** | `strings.Count(s, substr)`     | 计算子串在字符串中出现的次数                  |

分割与合并：

在处理CSV或路径的时候会十分有用，主要有两个函数：
- 分割 `Split` : 将字符串切分成片

```go
s := "abc,edf,ghi"
item := strings.Split(s, ",")
fmt.Println(item)
//output: [abc edf ghi]
```

- 合并: 将切片连接成字符串

```go
sil := []string{"abc","def","ghi"}
s2 := strings.Join(sil, "-")
fmt.Println(s2)
//output: abc-def-ghi
```

#### 字符

组成每个字符串的元素叫做“字符”，可以通过遍历或者单个获取字符串元素获得字符。 字符用单引号（’）包裹起来

在string中有两种字符类型：
- `uint8`类型，或者叫 byte 型，代表了ASCII码的一个字符。
- `rune`类型，代表一个 UTF-8字符。
> 实际上，`rune` 是一个int32

#### 字符串的修改

因为go的字符串是一个不可变字符组，所以当我们需要修改字符串的时候需要我们将字符串变为`rune[]`或者`byte[]`，然后在最后的时候转化回去

```go
func changeString() {
	s1 := "hello"
	// 强制类型转换
	byteS1 := []byte(s1)
	byteS1[0] = 'H'
	fmt.Println(string(byteS1))

	s2 := "你好世界"
	runeS2 := []rune(s2)
	runeS2[0] = '不'
	fmt.Println(string(runeS2))
}
```

> 但需要注意的是，这种转化会带来内存上的分配和拷贝问题，会对性能有一些开销问题

### 类型转换

在Go语言中，只有强制类型转化，没有隐式类型转化，其语法为 `T(表达式)`，其中T表示要转化的类型

## 流程语句

在go语言中，流程语句的书写习惯会更加偏向Python，比如`if`语句无需括号扩起，`for range`语法等

### if语句

在Go语言中if语句有这些特点:
- 可省略条件表达式括号。
- 持初始化语句，可定义代码块局部变量。 
- 代码块左括号必须在条件表达式尾部。

```go
func f7() {
	a := "喵"
	if  b := "喵"; a == b {
		fmt.Println("喵喵")
	}
}
```

### 循环

在Go语言中只有`for`循环，对于`for`循环有几种变体：

```go
func f8() {
	s1 := []int{1, 2, 3, 4}
	// 传统意义下的循环
	for i := 0; i < 4; i++ {
		fmt.Print(s1[i])
		fmt.Print(" ")
	}
	// 代替while循环
	n := 4
	for n > 0 {
		n--
		fmt.Print(s1[n])
		fmt.Print(" ")
	}
	// range 循环
	for idx, v := range s1 {
		fmt.Println(v)
		/*
			range会遍历指定的切片
			需要注意的是，这里的v是在循环第一步就被拷贝了的
			所以对这个v进行修改不会改变s1中的元素
			如果需要修改可以使用idx进行修改
		*/
		if idx == 2 {
			s1[idx] = 1
		}
	}
	// range 次数循环
	for range 4 {
		fmt.Println("喵")
	}
	p := 5
	for range p*2 - 1 {
		fmt.Println("喵")
	}
	// 死循环
	for {
		fmt.Println("喵")
	}
}
```

# 数组与切片

在Go中，数组类似和传统意义上的数组一致，是一种定死底层内存的数据结构，对于切片而言，其可以说是一种可扩展容量的数组

### 数组

数组是具有固定长度且编号连续的数据序列，具有以下特点
- **固定长度**:在声明的时候必须指定长度且不可更改
- **值类型**：在 Go 中，数组是值类型。如果你把一个数组赋值给另一个数组，它是完全拷贝一份数据。
- 注意长度也是构成数组类型的一部分，`[3]int` 和 `[4]int` 是两种完全不同的类型

### 切片

在Go语言中，有一种和C++中vector类似的数据结构，切片的声明如下:
```go
s := []int{0}
```

切片是对一个**连续片段的引用**，其本身并不储存任何数据，本质是一个很小的结构体，包含三个字段:
- 指针：指向底层数组中切片开始的位置
- 长度：切片当前包含的元素的个数
- 容量：从切片起始位置到底层数组末尾的元素个数

注意切片是引用的，当我们将一个切片赋值给另外一个变量的时候我们实际上传入的是引用，所以当我们修改其中一个的时候，另外一个也会变

#### 切片的初始化

原始的切片声明没办法实现复杂的初始化，我们可以用`make`语法对切片进行初始化

```go
func f5() {
	n := 3
	s1 := make([]int, n) 
	for idx := range s1 {
		s1[idx] = idx + 1
	}
	fmt.Println(s1)
}
```

我们利用make函数还可以进行类似C++中预先分配内存的操作

```go
func f6() {
	n := 3
	s1 := make([]int, 0, 2*n)
	idx := 1
	for range n * 2 {
		s1 = append(s1, idx)
		idx++
	}
	fmt.Println(s1)
}
```

#### 切片的复制

正如我们前面所说，如果我们直接将一个切片传入另外一个切片的时候，直接赋值的引用，要实现切片的赋值可以参考下面的两个语法

```go
func f4() {
	s1 := []int{1, 2, 3}
	// 使用append在一个空的数组后直接追加之前的元素
	s2 := append([]int{}, s1...)
	// 使用copy函数
	s3 := make([]int, len(s1)) // 注意这里s3的长度需要大于等于s1
	copy(s3, s1)
	s3[0] = 2
	s2[0] = 114
	fmt.Println(s1, s2, s3)
}
```

# map

Go语言的map通过make语法声明：

```go
mp := make(map[int]string)
mp[5] = "喵"
```

我们需要注意的是map中的键并非有序的，这个map更类似C++中的unordered_map

在go语言中，map的声明格式为 `map[KeyType]ValType`

我们推荐使用`make`语法初始化

```go
m := make(map[string]int)
m["age"] = 25
```

## map的comma ok

在获取 `map` 的值时，如果键不存在，Go 会返回该类型的零值（如 `int`返回`0`）。为了区分“值为0”和“键不存在”，我们通常这样做：

```go
val, ok := m["key"] 
if ok { 
	fmt.Println("找到值:", val) 
} else { 
	fmt.Println("键不存在") 
}
```

## map的遍历

我们可以使用`for range`对map进行遍历，但是我们需要注意的是，对map进行遍历的时候输出的顺序是随机的

### map的删除

我们可以用`delete`函数删除map的一个键值对,语法规则是`delete(map,key)`其中，map表示要删除键值对的map；key:表示要删除的键值对的键   

# 结构体

和其他语言一样，在Go语言中，结构体是将多个不同的数据结构组合在一起的自定义类型

因为在Go语言中不存在`Class`,所以`OOP`类型的语法都是通过结构体进行的

## 声明

```go
type User struct{
	ID     int
	name   string
	Email  string
}
```

对于结构体的实例化的方法有以下四种：
```go
// 实例化方法
	// 1.直接实例化
	var u0 User
	// 2.结构化实例(推荐)
	u1 := User{id: 1, name: "喵", Email: "?"}
	// 3.指针化实例
	u2 := &User{} // 返回的是一个空结构体指针
	// 4. 使用new实例化
	u3 := new(User)
```

> 在Go语言中，结构体在内存中是连续分布的，这使得结构体的访问速度非常快，对CPU缓存是友好的

## 结构体标签

在创建结构体元素的时候，我们可以为结构体打上标签

```go
type User struct {
	id    int    `json:"id"`
	name  string `json:"name"`
	Email string `json:"Email"`
}
```

这种标签可以通过标准库中的`reflect`在运行时被解析，用于序列化，数据库映射等

## 方法

与其他语言不同，Go语言中结构体的方法不能放在结构体内部，而是脱离于结构体之外的

它的语法是在 func 关键字后加一个接收者(Receiver)

| **类型** |        **语法**        | 能否修改结构体的值 |                    |
| :----: | :------------------: | :-------: | ------------------ |
|  值接受者  | `func (u User) f()`  |     否     | 拷贝一份副本，适合只读操作      |
| 指针接受者  | `func (u *User) f()` |     是     | **推荐方式**，效率高且能修改状态 |

```go
func (u *User) SetName(newName string) {
    u.Name = newName
}
```

## 组合与嵌套（伪继承）

在Go语言中不支持类的继承，而是提倡通过 *匿名嵌套* 来实现继承

```go
type Animal struct {
	Name string
}

func (a *Animal) Getname() {
	fmt.Println(a.Name)
}

type Dog struct {
	Animal  // 此时dog已经继承Animal的方法和成员
}

func main() {
	d := Dog{}
	d.Name = "狗"
	d.Getname()
}
```

这种继承方式被成为**组合**，在一个结构体里不止能有一个父类，可以有很多父类

```go
type C struct{
	A
	B
}
```

# 函数

Go语言摒弃了常规函数的类继承负担，设计的非常纯粹

## 函数声明和语法

Go语言的函数定义使用 `func` 关键字，其特点是变量名在前，类型在后
```go
func add(a int,b int) int{
	return a + b
}

// 如果有类型一致的可以简写
func add(a,b int) int{
	return a + b
}
```

## 多返回值

不同于C++或Java只能返回一个类型，Go语言原生支持返回多个值

- **常规返回**:

```go
func divide(a,b float64) (float64,error){
	if b == 0{
		return 0,errors.New("算术错误")
	}
	return a / b,nil
}
```

- **命名返回**：我们可以为返回值命名，这些初始的命名会被初始化为0值
```go
func getRectProps(width,height float64) (area, perimeter float64){
	area = weight*height
	perimeter = (weight+height)*2
	return     // 裸返回，自动返回开头写的两个变量
}
```

## 变长参数


如果我们不确定会传入多少个参数，可以使用 `...` 语法,在函数内部，这个参数会被当成切片处理
```go
func sum(nums ...int) int{
	tot := 0
	for _, n := range nums{
		tot += n
	}
	return tot
}
```

## 匿名函数和闭包

Go语言中支持匿名函数且这些函数可以作为闭包存在，即可以捕获并且记住其定义时所在作用域的变量
```go
func f1() func() int {
	i := 0
	res := func() int {
		i++
		return i
	}
	return res
}

func main() {
	counter := f1()        // 获取一个闭包
	fmt.Println(counter()) // 输出: 1
	fmt.Println(counter()) // 输出: 2
	fmt.Println(counter()) // 输出: 3
}
```

在上面的代码中你可能注意到了我们给`res`和`counter`都赋值了函数，这代表在Go语言中函数是可以被作为变量赋值，作为参数传递和作为返回值的

## 异常处理

在Go语言中，没有类似 `try-catch` 语句的异常捕获机制，其错误不是被抛出的，而是被当作普通的变量返回的

在go中我们有两种放回错误的方式：
- `errors.New("message")`:最基础的方式,每次调用都会创建一个全新的地址，即便错误信息一模一样，它们也不相等
- `fmt.Errorf("error is: %v", detail)`:用于格式化错误信息
