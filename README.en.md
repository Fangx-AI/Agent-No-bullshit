<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/wordmark-dark.svg">
  <img src="assets/wordmark.svg" alt="Agent-No-bullshit · Codex skill" width="100%">
</picture>

[中文](README.md) · **English**

A Codex skill for product development: cut repeated updates, unsupported notices, and redundant confirmations.

<a id="see-the-difference"></a>

## Deletion feedback

In the third test round, the old page announced the same deletion twice.

| Page generated with the old rules | Page generated with revised rules |
| :--- | :--- |
| Deleted 2 items. You can undo within 30 seconds.<br><br>Deleted 2 materials<br>Undo within 30 seconds<br>Undo deletion | Deleted 2 materials<br>30 seconds remaining<br>Undo deletion |

Both pages kept the notice before deletion: “Undo within 30 seconds. After that, the materials cannot be restored.” This is one specific improvement. The original interface text is Chinese; the strings above are translated.

[Original source](evaluations/2026-10-03-round3/current/task-c.html) · [Revised source](evaluations/2026-10-03-round3/feedback-one/task-c.html) · [Test record](evaluations/2026-10-03-round3/REPORT.en.md)

<a id="get-started-in-30-seconds"></a>

## Install

macOS / Linux:

```bash
git clone https://github.com/Fangx-AI/Agent-No-bullshit.git "${CODEX_HOME:-$HOME/.codex}/skills/agent-no-bullshit"
```

<details>
<summary>Windows PowerShell</summary>

```powershell
$skillRoot = if ($env:CODEX_HOME) { Join-Path $env:CODEX_HOME 'skills' } else { Join-Path $env:USERPROFILE '.codex\skills' }
New-Item -ItemType Directory -Force -Path $skillRoot | Out-Null
git clone https://github.com/Fangx-AI/Agent-No-bullshit.git (Join-Path $skillRoot 'agent-no-bullshit')
```

</details>

Invoke it in Codex:

```text
Use $agent-no-bullshit to build an image compression tool.
```

To update, run `git pull --ff-only` in the installation directory.

[Full rules (English translation)](SKILL.en.md) · [Share a case](https://github.com/Fangx-AI/Agent-No-bullshit/issues)
