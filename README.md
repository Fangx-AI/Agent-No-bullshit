# Agent-No-bullshit

**让 Codex 少说废话，做出更干净的产品。**

Less ceremony. Better products.

[查看 Skill](SKILL.md) · [安装](#安装) · [使用](#使用) · [效果示例](#效果示例)

---

你让 Codex 做一个上传页面，结果它给你加了版权声明、隐私提示、责任说明和三个确认框。

你让它修一个按钮，结果它先解释一遍计划，再提醒潜在风险，最后附上一份上线注意事项。

功能还没多复杂，用户已经要读很多字。

**Agent-No-bullshit 把一句话变成执行标准：这段话对用户到底有什么用？**

## 它改变什么

| 场景 | Agent-No-bullshit 的要求 |
| --- | --- |
| 需求已经明确 | 直接推进，减少重复表态和确认 |
| 汇报进度 | 只说新发现、关键取舍和真实阻塞 |
| 写产品文案 | 帮助用户操作、理解状态或作出决定 |
| 添加提醒 | 必须有具体依据，放在相关操作旁边 |
| 交付结果 | 说明做了什么、如何验证、还有什么没完成 |

不是把所有回答压成一句话。复杂问题可以讲透，简单任务不要灌水。

## 效果示例

下面是行为示例，不是实测记录或效果保证。

### 图片上传

**多余的版本**

> 请确保您拥有上传内容的合法权利，并已充分了解相关隐私及数据处理风险。继续使用即表示您理解并同意承担相应责任。

**有用的版本**

> 支持 JPG、PNG，最大 10 MB。

格式和大小应来自产品的真实限制。

### 开发交付

**多余的版本**

> 我已经完成了相关修改。需要注意的是，在实际部署到生产环境前，建议进一步综合评估兼容性、安全性以及可能存在的潜在风险……

**有用的版本**

> 已修复移动端导航，构建通过。尚未在真机上验证。

只报告实际完成的验证。

### 删除记录

**该留的就留**

> 删除这 12 条记录？删除后无法恢复。

这句话帮助用户作出决定，有实际用途。

## 安装

将仓库放入 Codex 的 Skills 目录，文件夹名保留为 `agent-no-bullshit`。

**macOS / Linux**

```bash
git clone https://github.com/Fangx-AI/Agent-No-bullshit.git "${CODEX_HOME:-$HOME/.codex}/skills/agent-no-bullshit"
```

**Windows PowerShell**

```powershell
$skillRoot = if ($env:CODEX_HOME) { Join-Path $env:CODEX_HOME 'skills' } else { Join-Path $env:USERPROFILE '.codex\skills' }
New-Item -ItemType Directory -Force -Path $skillRoot | Out-Null
git clone https://github.com/Fangx-AI/Agent-No-bullshit.git (Join-Path $skillRoot 'agent-no-bullshit')
```

上面的命令适用于首次安装。已安装时，在该仓库目录执行 `git pull --ff-only` 更新。

## 使用

在请求里加上 `$agent-no-bullshit`：

```text
使用 $agent-no-bullshit，帮我做一个图片压缩工具。
```

```text
使用 $agent-no-bullshit，检查这个页面的文案。
删掉没有实际用途的免责声明、说明和确认步骤，保留必要的操作信息。
```

```text
使用 $agent-no-bullshit，修复移动端菜单并验证结果。
```

Skill 保留默认的自动发现设置；显式调用可以更清楚地表达这次任务的偏好。它不会自动改写你的全局配置，也不保证每一轮都自动生效。

## 保留什么

具体的操作后果、真实错误、未完成的验证，以及有明确依据的必要告知，都应该准确表达。

判断标准不是有没有“风险”两个字，而是：**用户此刻是否需要这条信息？**

Skill 调整表达与产品设计取舍，不能覆盖 Codex 的更高优先级指令。

## 仓库结构

```text
agent-no-bullshit/
├── SKILL.md             # Codex 执行规则
├── agents/openai.yaml   # 显示名称与调用提示
└── README.md            # 项目介绍与安装方法
```

## 改进它

欢迎通过 Issue 或 PR 提交真实案例：原始请求、出现的多余文案、你期望的结果。请先移除私密信息。

优先修正能复现的问题，避免为了一个例子不断堆规则。

---

**每句话都该有用。**
