# FocusTodo — 本地待办事项管理应用 PRD

> **文档版本**: v1.0
> **编制日期**: 2026-05-12
> **产品类型**: 纯本地桌面应用（无需联网、无需账号）
> **设计原则**: 所有数据本地存储，无联网依赖，无账户体系，无付费墙

---

## 一、产品概述

### 1.1 产品定位
FocusTodo 是一款纯本地的跨平台桌面待办事项与时间管理应用。面向个人效率用户，提供任务管理、番茄钟、日历视图、分类标签、数据统计、桌面小组件等功能。所有数据存储在本地，启动即用，无需注册登录。

### 1.2 目标用户
- 个人效率爱好者
- GTD（Getting Things Done）实践者
- 需要精细化时间管理的职场人士和学生

### 1.3 技术选型建议
| 层级 | 推荐方案 |
|------|---------|
| 框架 | Electron |
| 前端 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 本地数据库 | better-sqlite3 |
| UI 组件 | Element Plus（或 Naive UI） |
| 图表 | ECharts |
| 打包 | electron-builder |

---

## 二、功能架构总览

```
FocusTodo
├── 任务管理
│   ├── 收集箱（默认入口）
│   ├── 今日任务
│   ├── 最近任务
│   ├── 已完成任务
│   ├── 回收站
│   ├── 子任务（清单）
│   ├── 任务附件（图片/文件）
│   └── 任务搜索
├── 时间管理
│   ├── 番茄钟（专注计时）
│   ├── 白噪音场景（内置 + 自定义）
│   ├── 番茄钟统计
│   └── 番茄钟浮动窗口
├── 组织与分类
│   ├── 分类管理（颜色 + 图标）
│   ├── 标签系统
│   ├── 重复任务（7种模式）
│   └── 节假日/工作日处理
├── 视图与统计
│   ├── 日历视图（月/周）
│   ├── 数据统计（图表可视化）
│   └── 排序（7种方式）
├── 桌面小组件
│   ├── 独立窗口小组件
│   ├── 日历小组件
│   └── 小组件设置（背景/置顶/位置）
├── 系统集成
│   ├── 系统托盘
│   ├── 系统通知（本地提醒）
│   ├── 剪贴板图片粘贴
│   └── 窗口拖拽与置顶
└── 设置
    ├── 通用设置（排序、默认分类、完成行为）
    ├── 番茄钟设置（时长、白噪音、通知）
    ├── 主题外观（浅色/深色）
    └── 快捷键（自定义录制）
```

---

## 三、核心功能模块详细说明

### 3.1 任务管理

#### 3.1.1 任务数据模型

```sql
CREATE TABLE tasks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id       TEXT UNIQUE NOT NULL,          -- UUID
    title         TEXT NOT NULL,                  -- 任务标题（必填）
    description   TEXT DEFAULT '',                -- 任务描述（选填，支持富文本）
    due_date      INTEGER,                        -- 截止时间（Unix 时间戳，选填）
    reminder_time INTEGER,                        -- 提醒时间（Unix 时间戳，选填）
    category_id   INTEGER REFERENCES categories(id), -- 所属分类
    tags          TEXT DEFAULT '[]',              -- 标签（JSON 数组，如 ["工作","紧急"]）
    priority      INTEGER DEFAULT 0,              -- 优先级 1-5
    sort_order    INTEGER DEFAULT 0,              -- 自定义排序权重
    complete      INTEGER DEFAULT 0,              -- 完成状态 0/1
    is_deleted    INTEGER DEFAULT 0,              -- 软删除标记 0/1
    repeat_rule   TEXT DEFAULT NULL,              -- 重复规则（JSON，见 3.1.4）
    subtasks      TEXT DEFAULT NULL,              -- 子任务（JSON 数组，见 3.1.5）
    files         TEXT DEFAULT '[]',              -- 附件列表（JSON 数组）
    created_at    INTEGER NOT NULL,               -- 创建时间
    updated_at    INTEGER NOT NULL                -- 最后更新时间
);
```

#### 3.1.2 任务视图

| 视图 | 路由 | 说明 | 筛选逻辑 |
|------|------|------|---------|
| **收集箱** | `/inbox` | 默认首页入口 | `category_id IS NULL AND is_deleted = 0 AND complete = 0` |
| **今日** | `/today` | 今日待办 | `due_date <= 今日23:59:59 AND is_deleted = 0 AND complete = 0`，逾期任务标红 |
| **最近** | `/recent` | 最近编辑 | `is_deleted = 0`，按 `updated_at DESC` 排序，取最近 50 条 |
| **已完成** | `/completed` | 已归档任务 | `complete = 1 AND is_deleted = 0`，按完成日期倒序 |
| **回收站** | `/trash` | 已删除任务 | `is_deleted = 1`，支持恢复或永久删除 |

**视图公共行为：**
- 任务按日期分组展示（今天、明天、即将到来、已逾期）
- 每组显示任务数量
- 空状态时展示引导文案和插图
- 支持下拉刷新

#### 3.1.3 任务编辑

**入口：**
1. 点击任务卡片 → 右侧滑出编辑面板（主窗口内）
2. 双击任务 → 弹出独立编辑窗口（Electron 新 BrowserWindow）

**编辑字段：**

| 字段 | 控件 | 必填 | 说明 |
|------|------|------|------|
| 标题 | 单行输入框 | 是 | 最大 200 字 |
| 描述 | 多行文本域 | 否 | 支持基础富文本（加粗、列表） |
| 截止日期 | 日期时间选择器 | 否 | 支持只选日期或日期+时间 |
| 提醒时间 | 日期时间选择器 | 否 | 仅在设置了截止日期时可设置，须早于截止时间 |
| 分类 | 下拉选择 | 否 | 从已有分类中选择，或"无分类" |
| 标签 | 多选标签输入 | 否 | 输入文字后回车创建新标签，或从已有标签中选择 |
| 优先级 | 5级选择器 | 否 | 1（最低）~ 5（最高），默认无优先级 |
| 重复规则 | 重复设置面板 | 否 | 见 3.1.4 |
| 子任务 | 子任务编辑器 | 否 | 见 3.1.5 |
| 附件 | 文件上传区 | 否 | 见 3.1.6 |

**快捷添加：**
- 列表底部固定输入框，输入标题后按 Enter 快速创建任务
- 快捷创建的任务默认归入当前视图对应的分类

**批量操作：**
- 进入多选模式 → 勾选多个任务 → 批量操作栏浮现
- 支持操作：批量删除（移入回收站）、批量移动分类、批量标记完成、批量修改优先级

#### 3.1.4 重复任务

**数据结构：**
```json
{
    "type": "daily | weekday | weekly | monthly | monthly_last | yearly | yearly_lunar",
    "interval": 1,
    "end_count": 90,
    "end_date": null,
    "week_days": [1, 2, 3, 4, 5],
    "month_days": [15],
    "year_month": 6,
    "year_month_day": 15,
    "lunar_month": null,
    "lunar_day": null,
    "skip_holidays": false,
    "skip_weekends": false,
    "use_workdays": false
}
```

**7 种重复模式：**

| 模式 | type 值 | 配置 | 说明 |
|------|---------|------|------|
| 每天 | `daily` | interval（间隔天数）、end_count 或 end_date | 每隔 N 天重复 |
| 工作日 | `weekday` | 无额外配置 | 仅周一至周五 |
| 每周 | `weekly` | week_days（星期几数组）、end_count | 选定星期几重复 |
| 每月 | `monthly` | month_days（几号数组）、end_count | 每月指定几号 |
| 每月最后一天 | `monthly_last` | end_count | 自动处理大小月 |
| 每年 | `yearly` | year_month + year_month_day、end_count | 公历年重复 |
| 每年（农历） | `yearly_lunar` | lunar_month + lunar_day、end_count | 农历日期，自动转公历判断 |

**特殊规则：**
- 跳过节假日：遇法定节假日自动跳到下一个工作日
- 跳过周末：周六日自动跳过
- 法定工作日模式：按国家法定工作日执行
- 节假日数据内置中国法定节假日日历（需每年更新）

**行为说明：**
- 勾选完成一个重复任务后，自动生成下一个周期的实例
- 删除重复任务时弹出确认框："是否删除所有未来的重复实例？"（是 / 仅删除此次）
- 编辑重复任务时提示："修改将应用于所有未来的重复实例"

#### 3.1.5 子任务

**数据结构：**
```json
[
    { "id": "sub_1", "title": "子任务A", "complete": false },
    { "id": "sub_2", "title": "子任务B", "complete": true },
    { "id": "sub_3", "title": "子任务C（缩进）", "complete": false, "parent_id": "sub_1" }
]
```

**功能：**
- 每个任务支持嵌套子任务（最多 3 级缩进）
- 子任务独立勾选完成/取消完成
- 支持拖拽排序
- 支持添加、删除、编辑
- 子任务进度自动计算并显示在父任务上（如 "2/5"）
- 所有子任务完成时，父任务自动标记完成（可配置开关）

#### 3.1.6 任务附件

**功能：**
- 支持粘贴剪贴板图片（Ctrl+V）
- 支持文件选择对话框上传（拖拽或点击上传区）
- 图片支持缩略图预览，点击打开大图查看器
- 通用文件显示文件图标、文件名、文件大小
- 文件存储在本地：`{userData}/attachments/{task_id}/{filename}`
- 支持删除附件
- 上传时显示进度条

**限制：**
- 单个文件大小限制：50MB
- 单个任务附件数量限制：20 个

#### 3.1.7 任务搜索

**入口：** 左侧边栏顶部搜索框，或全局快捷键 `Ctrl+F`

**搜索逻辑：**
1. **拼音搜索**（默认开启）：将任务标题转为不带声调拼音进行匹配，如输入 "huoche" 匹配 "火车票"
2. **中文分词**（默认开启）：对中文内容进行简单分词匹配
3. **模糊匹配**（默认开启）：基于编辑距离的容错匹配，阈值 0.6

**搜索范围：** 任务标题、任务描述、子任务标题

**结果展示：**
- 匹配文本高亮显示（黄色背景标记）
- 实时搜索（输入即搜，300ms 防抖）
- 显示匹配结果数量
- 空结果时提示"未找到匹配的任务"

---

### 3.2 番茄钟（Pomodoro Timer）

#### 3.2.1 数据模型

```sql
CREATE TABLE tomato_records (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tomato_id       TEXT UNIQUE NOT NULL,
    start_time      INTEGER NOT NULL,
    end_time        INTEGER NOT NULL,
    focus_duration  INTEGER NOT NULL,   -- 专注时长（分钟）
    rest_duration   INTEGER NOT NULL,   -- 休息时长（分钟）
    is_focus        INTEGER DEFAULT 1,  -- 1=专注 0=休息
    task_id         TEXT,               -- 关联任务（选填）
    task_title      TEXT,               -- 冗余存储任务标题（防任务删除后丢失）
    created_at      INTEGER NOT NULL
);
```

#### 3.2.2 基本功能

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 专注时长 | 25 分钟 | 范围 1~120 分钟，步长 5 |
| 短休息时长 | 5 分钟 | 范围 1~30 分钟，步长 1 |
| 长休息时长 | 15 分钟 | 范围 5~60 分钟，步长 5 |
| 长休息间隔 | 4 个番茄 | 每完成 N 个番茄后触发长休息 |
| 自动开始休息 | 关闭 | 专注结束后自动开始休息倒计时 |
| 自动开始专注 | 关闭 | 休息结束后自动开始专注倒计时 |
| 系统通知 | 开启 | 倒计时结束时发送系统通知 |
| 声音提示 | 开启 | 倒计时结束时播放提示音 |
| 完成音效 | 开启 | 专注完成时播放特殊音效 |

**状态流转：**
```
空闲 → 专注中 → 专注完成 → 休息中 → 休息完成 → 专注中
                                          ↘ 长休息中 → 长休息完成 → 专注中
```

**交互：**
- 开始/暂停按钮
- 重置当前倒计时
- 跳过当前阶段（休息/专注）
- 可选择关联到某个任务（关联后番茄记录显示任务标题）

#### 3.2.3 浮动窗口

- 独立 Electron 窗口（BrowserWindow），可拖拽到桌面任意位置
- 紧凑模式：仅显示倒计时数字 + 状态指示色（工作=红色圆点，休息=绿色圆点）
- 展开模式：显示完整控制面板（开始/暂停、跳过、关联任务）
- 可置顶（始终在最前）
- 窗口最小化时缩小为小圆形，显示剩余时间
- 关闭浮动窗口不停止计时，再次打开恢复显示

#### 3.2.4 白噪音

**内置白噪音场景（10种）：**

| 场景 | 说明 | 音频文件 |
|------|------|---------|
| 咖啡馆 | 咖啡厅环境音 | 内置 MP3 |
| 森林 | 森林鸟鸣 | 内置 MP3 |
| 雨声 | 雨天白噪音 | 内置 MP3 |
| 海浪 | 海浪拍打声 | 内置 MP3 |
| 雷电 | 雷雨声 | 内置 MP3 |
| 火车 | 列车行进声 | 内置 MP3 |
| 街道 | 城市街道环境音 | 内置 MP3 |
| 洞穴 | 洞穴回声 | 内置 MP3 |
| 火声 | 壁炉火焰声 | 内置 MP3 |
| 风声 | 风声白噪音 | 内置 MP3 |

**自定义白噪音：**
- 支持用户导入自定义 MP3 音频文件
- 存储路径：`{userData}/white-noise/`
- 播放时支持音量调节

**行为：**
- 白噪音在番茄钟专注阶段自动播放，休息阶段可选择继续或暂停
- 支持同时播放多个白噪音场景并分别调节音量
- 提供全局静音按钮

#### 3.2.5 番茄钟统计

**统计页面（`/statistics/tomato`）：**

| 统计项 | 说明 |
|--------|------|
| 今日番茄数 | 当日完成的专注番茄数量 |
| 今日专注总时长 | 当日累计专注分钟数 |
| 连续番茄天数 | 连续每天至少完成 1 个番茄的天数 |
| 日趋势图 | 近 30 天每日番茄数量折线图 |
| 周汇总 | 按周汇总：本周完成数 vs 上周完成数对比柱状图 |
| 月度热力图 | 类似 GitHub 贡献图，按天色块显示番茄密度 |

**图表实现：** 使用 ECharts，数据全部来自本地 SQLite 查询

---

### 3.3 分类管理

#### 3.3.1 数据模型

```sql
CREATE TABLE categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#4A90D9',  -- 十六进制颜色
    icon        TEXT DEFAULT 'folder',             -- 图标标识
    sort_order  INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL
);
```

#### 3.3.2 分类属性

| 属性 | 说明 |
|------|------|
| 名称 | 用户自定义，不可重名，最长 20 字 |
| 颜色 | 12色预设色板 + 自定义颜色选择器（色轮） |
| 图标 | 内置图标集（约 20 个常用图标） |
| 排序 | 支持拖拽排序 |
| 任务数 | 自动统计，不存储，实时查询 |

#### 3.3.3 分类操作

| 操作 | 说明 |
|------|------|
| 新建 | 弹窗填写名称 + 选择颜色 + 选择图标 |
| 编辑 | 弹窗修改名称/颜色/图标 |
| 删除 | 确认弹窗："该分类下的 N 个任务将移至收集箱"，确认后执行 |
| 拖拽排序 | 长按拖拽调整分类在侧边栏的显示顺序 |
| 重命名 | 侧边栏双击分类名进入编辑态 |

#### 3.3.4 分类视图

- 点击侧边栏分类进入分类视图
- 展示该分类下的所有任务（未完成 + 已完成分组）
- 支持在分类视图内直接新建任务（自动归入该分类）

#### 3.3.5 预设分类（首次使用自动创建）

| 分类名 | 颜色 | 图标 |
|--------|------|------|
| 工作 | #4A90D9 | 💼 |
| 学习 | #F5A623 | 📚 |
| 生活 | #7ED321 | 🏠 |
| 健康 | #D0021B | ❤️ |

用户可删除或修改预设分类。

---

### 3.4 标签系统

#### 3.4.1 数据模型

标签不需要独立表，直接存储在任务的 `tags` 字段（JSON 数组）中。通过聚合查询实现标签管理。

#### 3.4.2 功能清单

| 功能 | 说明 |
|------|------|
| 创建标签 | 在任务编辑的标签输入框中输入文字 + 回车即可创建 |
| 删除标签 | 在标签管理页删除，所有任务中自动移除该标签 |
| 重命名标签 | 在标签管理页重命名，所有任务中自动更新 |
| 任务打标签 | 一个任务可关联多个标签 |
| 标签筛选 | 点击标签显示所有包含该标签的任务 |
| 标签建议 | 输入时自动补全已有标签（下拉列表） |
| 标签统计 | 每个标签旁显示关联的任务数量 |
| 标签排序 | 按使用频率或任务数量排序 |

---

### 3.5 日历视图

#### 3.5.1 月视图

- 标准月历网格（7列 x 6行），每格显示日期数字
- 今日日期高亮（圆形背景色）
- 非当月日期灰显（字体颜色变浅）
- 有任务的日期下方显示小圆点指示器（不同颜色代表不同分类）
- 有 3 个以上任务的日期显示任务数量角标
- 点击日期 → 右侧面板显示该日任务列表

#### 3.5.2 周视图

- 横向展示一周 7 天
- 每天显示任务数量
- 点击某天展开任务列表
- 支持"上一周 / 下一周"切换

#### 3.5.3 导航功能

- 顶部显示当前年月，可点击弹出月份快速跳转面板
- "今天"按钮快速回到当月
- 前后箭头切换月份/周

---

### 3.6 数据统计

#### 3.6.1 统计页面

统计页面包含 Tab 切换：任务统计 | 番茄统计

**任务统计：**

| 图表 | 类型 | 说明 |
|------|------|------|
| 完成趋势 | 折线图 | 近 30 天每日完成任务数 |
| 新增趋势 | 折线图 | 近 30 天每日新建任务数 |
| 完成率 | 环形图 | 已完成 / 总任务 比例 |
| 分类分布 | 饼图 | 各分类任务数量占比 |
| 优先级分布 | 柱状图 | 各优先级任务数量 |
| 逾期任务 | 数字卡片 | 当前逾期的任务数量（红色醒目） |
| 周对比 | 柱状图 | 本周 vs 上周完成数对比 |
| 累计完成 | 面积图 | 历史累计完成任务总数趋势 |

**番茄统计：** 见 3.2.5

#### 3.6.2 排序方式

全局任务列表支持以下 7 种排序（在视图顶部下拉切换）：

| 排序方式 | 字段 | 方向 |
|---------|------|------|
| 按提醒时间 | reminder_time | ASC（最近提醒排前） |
| 按创建时间（升序） | created_at | ASC |
| 按创建时间（降序） | created_at | DESC |
| 按优先级（高→低） | priority | DESC |
| 按优先级（低→高） | priority | ASC |
| 按截止时间 | due_date | ASC（最近到期排前） |
| 按完成状态 | complete | ASC（未完成排前） |
| 按自定义排序 | sort_order | ASC（拖拽排序） |

---

### 3.7 桌面小组件（Widget）

#### 3.7.1 小组件窗口

| 特性 | 说明 |
|------|------|
| 独立窗口 | 独立 BrowserWindow，可在桌面任意位置拖拽 |
| 置顶 | 可设置始终在最前面（`alwaysOnTop`） |
| 调整大小 | 支持拖拽边角调整宽高 |
| 多实例 | 支持同时打开多个小组件，各自独立配置 |
| 透明度 | 可调节窗口透明度（30%~100%） |
| 背景色 | 可自定义窗口背景颜色 |
| 状态持久化 | 小组件的位置、大小、配置自动保存，重启后恢复 |

#### 3.7.2 小组件功能

| 功能 | 说明 |
|------|------|
| 任务列表 | 显示指定分类/日期的任务 |
| 快速完成 | 点击复选框直接标记完成 |
| 快速添加 | 顶部输入框直接创建任务 |
| 日期切换 | 前后箭头切换查看不同日期 |
| 分类切换 | 下拉选择分类进行筛选 |
| 双击跳转 | 双击任务在主窗口中打开编辑 |

#### 3.7.3 日历小组件

- 独立的日历小组件窗口
- 内嵌月历视图，占用空间约 280x300px
- 点击日期在下方展开该日任务列表
- 支持置顶和拖拽
- 数据与主窗口共享（同一 SQLite 数据库）

#### 3.7.4 小组件管理入口

- 设置页面中"小组件管理"面板
- 可查看所有现有小组件列表
- 可创建/删除小组件
- 可重置所有小组件位置

---

### 3.8 设置

#### 3.8.1 通用设置

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 默认排序 | 下拉选择 | 按提醒时间 | 新视图的默认排序方式 |
| 默认分类 | 下拉选择 | 无 | 新建任务时默认归入的分类 |
| 完成后行为 | 单选 | 留在原位 | "留在原位" / "移至已完成" / "移至底部" |
| 删除确认 | 开关 | 开启 | 删除任务前是否弹出确认对话框 |
| 子任务全部完成自动完成父任务 | 开关 | 开启 | 所有子任务完成时是否自动完成父任务 |

#### 3.8.2 番茄钟设置

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 专注时长 | 滑块 | 25 分钟 | 1~120 分钟 |
| 短休息时长 | 滑块 | 5 分钟 | 1~30 分钟 |
| 长休息时长 | 滑块 | 15 分钟 | 5~60 分钟 |
| 长休息间隔 | 数字 | 4 | 每完成 N 个番茄触发长休息 |
| 自动开始休息 | 开关 | 关 | 专注结束自动开始休息 |
| 自动开始专注 | 开关 | 关 | 休息结束自动开始专注 |
| 系统通知 | 开关 | 开 | 倒计时结束时系统通知 |
| 声音提示 | 开关 | 开 | 倒计时结束时提示音 |
| 显示浮动窗口 | 开关 | 开 | 是否启用番茄钟浮动窗口 |

#### 3.8.3 外观设置

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 主题模式 | 切换 | 浅色 | 浅色 / 深色 / 跟随系统 |
| 语言 | 下拉选择 | 简体中文 | 简体中文 / English |

#### 3.8.4 快捷键设置

| 功能 | 默认快捷键 | 说明 |
|------|-----------|------|
| 新建任务 | `Ctrl+N` | 在当前视图快速创建任务 |
| 搜索 | `Ctrl+F` | 聚焦搜索框 |
| 开始/暂停番茄钟 | `Ctrl+T` | 切换番茄钟状态 |
| 切换深色模式 | `Ctrl+D` | 切换浅色/深色主题 |
| 显示/隐藏主窗口 | `Ctrl+Shift+H` | 全局快捷键，窗口隐藏时唤出 |

**自定义快捷键：**
- 每个功能旁显示当前快捷键
- 点击进入录制模式（按下新的按键组合自动识别）
- 支持 Ctrl / Alt / Shift / Ctrl+Shift 组合
- 显示冲突检测（与已有快捷键重复时提示）

#### 3.8.5 数据管理

| 功能 | 说明 |
|------|------|
| 数据导出 | 导出全部数据为 JSON 文件 |
| 数据导入 | 从 JSON 文件恢复数据 |
| 清空回收站 | 一键永久删除回收站内所有任务 |
| 重置应用数据 | 危险操作，二次确认后清空所有本地数据 |

---

### 3.9 系统集成

| 功能 | 说明 |
|------|------|
| 系统托盘 | 关闭窗口最小化到系统托盘；托盘图标右键菜单：显示窗口 / 新建任务 / 开始番茄钟 / 退出 |
| 系统通知 | 任务到期提醒、番茄钟阶段结束提醒（使用 Electron Notification API） |
| 剪贴板 | 任务编辑区支持 Ctrl+V 粘贴剪贴板中的图片 |
| 开机自启 | 可选设置，使用 Electron app.setLoginItemSettings |
| 硬件加速 | 默认开启，设置中提供"禁用硬件加速"选项（兼容模式） |
| 最小化到托盘 | 关闭按钮行为可选：最小化到托盘 / 直接退出 |

---

## 四、数据存储设计

### 4.1 数据库设计

**数据库文件：** `{app.getPath("userData")}/focus-todo.db`

**使用 better-sqlite3（同步 API），无需加密版本（无账号体系无隐私顾虑）。**

#### 完整表结构

```sql
-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id         TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT DEFAULT '',
    due_date        INTEGER,
    reminder_time   INTEGER,
    category_id     INTEGER,
    tags            TEXT DEFAULT '[]',
    priority        INTEGER DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    complete        INTEGER DEFAULT 0,
    is_deleted      INTEGER DEFAULT 0,
    repeat_rule     TEXT DEFAULT NULL,
    subtasks        TEXT DEFAULT NULL,
    files           TEXT DEFAULT '[]',
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    color       TEXT NOT NULL DEFAULT '#4A90D9',
    icon        TEXT DEFAULT 'folder',
    sort_order  INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL
);

-- 番茄钟记录表
CREATE TABLE IF NOT EXISTS tomato_records (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tomato_id       TEXT UNIQUE NOT NULL,
    start_time      INTEGER NOT NULL,
    end_time        INTEGER NOT NULL,
    focus_duration  INTEGER NOT NULL,
    rest_duration   INTEGER NOT NULL,
    is_focus        INTEGER DEFAULT 1,
    task_id         TEXT,
    task_title      TEXT,
    created_at      INTEGER NOT NULL
);

-- 小组件配置表
CREATE TABLE IF NOT EXISTS widgets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    widget_id       TEXT UNIQUE NOT NULL,
    type            TEXT NOT NULL DEFAULT 'todo',   -- todo | calendar
    x               INTEGER DEFAULT 100,
    y               INTEGER DEFAULT 100,
    width           INTEGER DEFAULT 300,
    height          INTEGER DEFAULT 400,
    always_on_top   INTEGER DEFAULT 0,
    opacity         INTEGER DEFAULT 100,
    background_color TEXT DEFAULT '#FFFFFF',
    category_id     INTEGER,
    selected_date   TEXT,                             -- ISO 日期字符串
    config          TEXT DEFAULT '{}',
    created_at      INTEGER NOT NULL
);

-- 应用设置表
CREATE TABLE IF NOT EXISTS app_settings (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_complete ON tasks(complete);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tomato_created ON tomato_records(created_at);
```

### 4.2 文件存储结构

```
{userData}/
├── focus-todo.db              # SQLite 数据库
├── attachments/               # 任务附件
│   ├── {task_id}/
│   │   ├── image1.png
│   │   └── document.pdf
│   └── ...
├── white-noise/               # 用户自定义白噪音
│   ├── custom1.mp3
│   └── ...
├── widgets-config.json        # 小组件窗口位置/状态（JSON 备份）
└── sounds/                    # 内置提示音
    ├── complete.mp3
    ├── tick.mp3
    └── alarm.mp3
```

### 4.3 配置存储

使用 `app_settings` 表存储键值对配置，替代 electron-store：

| key | value 示例 | 说明 |
|-----|-----------|------|
| theme | "light" / "dark" / "system" | 主题 |
| language | "zh-CN" / "en" | 语言 |
| default_sort | "reminder" | 默认排序 |
| default_category_id | "3" | 默认分类 |
| complete_behavior | "stay" | 完成后行为 |
| tomato_focus_duration | "25" | 番茄钟专注时长 |
| tomato_rest_duration | "5" | 番茄钟休息时长 |
| tomato_long_rest_duration | "15" | 长休息时长 |
| tomato_long_rest_interval | "4" | 长休息间隔 |
| shortcuts | '{"new_task":"Ctrl+N",...}' | 自定义快捷键 JSON |
| minimize_to_tray | "true" | 关闭时最小化到托盘 |
| launch_at_login | "false" | 开机自启 |

---

## 五、界面布局结构

### 5.1 主窗口布局

```
┌──────────────────────────────────────────────────┐
│ 标题栏（-webkit-app-region: drag）    [—][□][×]  │
├─────────┬────────────────────┬───────────────────┤
│ 🔍 搜索 │                    │                   │
│         │                    │    任务编辑面板    │
│ 📥 收集箱│                    │    ────────────    │
│ ☀️ 今天  │    主内容区         │    标题: ______   │
│ 📅 日历  │                    │    描述: ______   │
│ 📊 统计  │    （根据左侧导航   │    截止: ______   │
│ 📁 工作  │     切换不同视图）  │    分类: ______   │
│ 📁 学习  │                    │    标签: ______   │
│ 📁 生活  │                    │    优先级: ___    │
│ 📁 健康  │                    │    重复: ______   │
│         │                    │    子任务: ____   │
│         │                    │    附件: ______   │
│─────────│                    │                   │
│ ⚙️ 设置 │                    │                   │
└─────────┴────────────────────┴───────────────────┘
```

### 5.2 窗口类型清单

| 窗口 | 文件 | 尺寸 | 说明 |
|------|------|------|------|
| 主窗口 | index.html | 900x600（最小 800x500） | 三栏布局：侧边栏 + 内容区 + 编辑面板 |
| 小组件窗口 | widget.html | 300x400（可调） | 桌面浮动小组件 |
| 日历小组件 | calendar-widget.html | 280x320（可调） | 独立日历小组件 |
| 番茄钟浮动窗 | tomato-float.html | 200x80（紧凑）/ 300x200（展开） | 番茄钟悬浮窗 |
| 日期选择器 | date-picker.html | 320x360 | 弹出式日期选择 |

### 5.3 路由设计

| 路径 | 组件 | 说明 |
|------|------|------|
| `/inbox` | InboxView | 收集箱 |
| `/today` | TodayView | 今日任务 |
| `/recent` | RecentView | 最近任务 |
| `/calendar` | CalendarView | 日历视图 |
| `/statistics` | StatisticsView | 统计概览 |
| `/statistics/tomato` | TomatoStatisticsView | 番茄钟统计 |
| `/category/:id` | CategoryView | 分类任务列表 |
| `/completed` | CompletedView | 已完成任务 |
| `/trash` | TrashView | 回收站 |
| `/search` | SearchView | 搜索结果 |
| `/settings` | SettingsView | 设置页面 |

---

## 六、开发优先级（建议迭代计划）

### P0 — MVP（核心可用）

| 模块 | 功能 | 说明 |
|------|------|------|
| 任务管理 | CRUD、5个视图、编辑面板 | 核心中的核心 |
| 分类管理 | 增删改、侧边栏展示 | 任务组织基础 |
| 标签 | 基础标签功能 | 任务辅助分类 |
| 数据库 | SQLite 建表和 DAO 层 | 数据层 |
| 系统托盘 | 托盘图标 + 基础菜单 | 桌面应用基础 |

### P1 — 完善体验

| 模块 | 功能 | 说明 |
|------|------|------|
| 番茄钟 | 基础计时 + 浮动窗口 | 时间管理核心 |
| 日历视图 | 月视图 + 日期任务查看 | 时间维度查看 |
| 子任务 | 嵌套子任务清单 | 任务细化 |
| 搜索 | 拼音 + 模糊搜索 | 快速查找 |
| 排序 | 7种排序方式 | 任务组织 |
| 主题 | 浅色/深色 | 用户体验 |

### P2 — 高级功能

| 模块 | 功能 | 说明 |
|------|------|------|
| 重复任务 | 7种模式 + 节假日处理 | 自动化任务 |
| 番茄钟 | 白噪音场景 | 专注辅助 |
| 统计 | 图表可视化 | 数据分析 |
| 附件 | 图片/文件上传 | 任务资料管理 |
| 快捷键 | 自定义录制 | 效率操作 |

### P3 — 锦上添花

| 模块 | 功能 | 说明 |
|------|------|------|
| 桌面小组件 | 独立窗口 + 日历小组件 | 桌面效率 |
| 数据导入导出 | JSON 备份恢复 | 数据安全 |
| 农历重复 | 农历日期支持 | 特色功能 |
| 语言切换 | 中英文 | 国际化 |

---

## 七、非功能性需求

| 维度 | 要求 |
|------|------|
| 启动速度 | 冷启动 < 2 秒 |
| 内存占用 | 主窗口 < 150MB，每个小组件 < 30MB |
| 数据容量 | 单数据库支持 10 万条任务无卡顿 |
| 响应性能 | 任务列表滚动 60fps，搜索响应 < 300ms |
| 数据安全 | 所有数据本地存储，无网络传输 |
| 兼容性 | Windows 10+、macOS 12+、Ubuntu 20.04+ |
| 无障碍 | 支持键盘导航、系统缩放适配 |

---

*本文档基于 Todo清单（杭州乾夕科技）产品的功能分析，重新整理为纯本地版本的开发需求规格。所有功能均为原创设计描述，不涉及原产品代码复制。*
