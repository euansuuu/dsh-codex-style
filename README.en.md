<div align="center">

# DSH Codex Style

**A theme plugin that brings the look and feel of the OpenAI Codex desktop app to the DeepSeek Harness Web GUI, modified from [dsh-claude-style](https://github.com/Nwflower/dsh-claude-style).**

> **Why settle for another Codex when your next Codex desktop is here.**

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)
[![简体中文](https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg)](README.md)

</div>

## Preview

DeepSeek is the default brand: the sidebar keeps the host's own whale and the DeepSeek wordmark, buttons follow DeepSeek blue, the composer's hints stay the host's own words, and the sidebar directory reads codex's “Projects”. Switch between the Claude and DeepSeek brands in settings; light and dark follow the system. Appearance offers six colour presets — Claude, DeepSeek, Parchment, Forest, Dusk and Rose — lets you edit them, and lets you create, duplicate, rename and delete colour schemes.

### What this fork changes

This repository keeps every feature of the upstream plugin and makes four changes on top:

- **Codex-style composer**: the text field and its controls merge into one rounded card, the add button leads the permission control, and the send button becomes a round brand-coloured button in the card's lower right corner. Crowded layouts stay on the upstream responsive mechanism.
- **Personal profile**: the name in the account popover opens a profile page with this machine's token usage, active days, a year of activity and the installed plugins.
- **DeepSeek is the default brand**: without touching any preference, the page presents DeepSeek's own logo, palette and copy.
- **Configurable session words**: the wording of the process rows and the waiting line is adjustable in the preferences.

### Claude

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/claude-home-light.png" alt="Claude brand, Code home — light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/claude-home-dark.png" alt="Claude brand, Code home — dark" /></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/claude-conversation-light.png" alt="Claude brand, Markdown conversation — light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/claude-conversation-dark.png" alt="Claude brand, Markdown conversation — dark" /></td>
  </tr>
</table>

> Code home above, Markdown conversation below; light on the left, dark on the right.

### DeepSeek

<table>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/deepseek-home-light.png" alt="DeepSeek brand, Code home — light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/deepseek-home-dark.png" alt="DeepSeek brand, Code home — dark" /></td>
  </tr>
  <tr>
    <td align="center" width="50%"><img src="./docs/screenshots/deepseek-conversation-light.png" alt="DeepSeek brand, Markdown conversation — light" /></td>
    <td align="center" width="50%"><img src="./docs/screenshots/deepseek-conversation-dark.png" alt="DeepSeek brand, Markdown conversation — dark" /></td>
  </tr>
</table>

> Deepy the pixel whale stands on the composer in eight states:

<table>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/idle.gif" width="120" alt="Idle" /><br />Idle</td>
    <td align="center" width="25%"><img src="./docs/gifs/thinking.gif" width="120" alt="Thinking" /><br />Thinking</td>
    <td align="center" width="25%"><img src="./docs/gifs/typing.gif" width="120" alt="Answering and calling tools" /><br />Answering and calling tools</td>
    <td align="center" width="25%"><img src="./docs/gifs/conducting.gif" width="120" alt="Conducting subagents" /><br />Conducting subagents</td>
  </tr>
  <tr>
    <td align="center" width="25%"><img src="./docs/gifs/notification.gif" width="120" alt="Waiting on you" /><br />Waiting on you</td>
    <td align="center" width="25%"><img src="./docs/gifs/error.gif" width="120" alt="Failed" /><br />Failed</td>
    <td align="center" width="25%"><img src="./docs/gifs/happy.gif" width="120" alt="Finished" /><br />Finished</td>
    <td align="center" width="25%"><img src="./docs/gifs/sleeping.gif" width="120" alt="Asleep" /><br />Asleep</td>
  </tr>
</table>

## Installation

Install this repository from a terminal:

```bash
dsh plugin --profile web add euansuuu/dsh-codex-style
```

The plugin shares its package name with the upstream npm package (`dsh-claude-style`), so the two cannot be installed at the same time: installing this repository over the upstream npm package replaces the plugin of the same name. Keep one theme enabled at a time; dsh ≥ 0.2.2-rc.1 is required, and restart DeepSeek Harness after installing.

## Declarative appearance configuration

`paletteSchemes` and `brandingPresets` accept both nested YAML objects and the existing JSON-string records. This snippet shows plugin fields only, not a complete Harness profile:

```yaml
palette: claude
paletteColors: company-ocean
paletteSchemes:
  - id: company-ocean
    name: Company Ocean
    base: deepseek
    accent: "#2855d9"
    background:
      light: "#f7f9ff"
      dark: "#111827"
    code:
      light: "#173f99"
      dark: "#b8ceff"

brandingPreset: company-primary
brandingPresets:
  - id: company-primary
    name: Company Primary
    ink: original
    mark:
      light: "./branding/primary-mark-light.svg"
      dark: "./branding/primary-mark-dark.svg"
    wordmark: "./branding/primary-wordmark.svg"

modelOrder: custom
modelOrderRows:
  - deepseek-official/deepseek-v4.1-pro
  - sensenova/sensenova-6.8-flash
```

- Colour records use the five-seed model (`accent`, `background`, `text`, `code`, `link`) plus `edges`. The six built-in presets (`claude`, `deepseek`, `parchment`, `forest`, `dusk`, `rose`) and **Follow the brand** remain available.
- A logo preset has a stable `id`, an optional `name`, at least one of `mark` or `wordmark`, and an optional `ink` field (`original`, `accent` or `text`, defaulting to the original image colours). One string uses the same image in both appearances; a `light` / `dark` pair selects by appearance, with the supplied side covering a missing side.
- Relative image paths resolve from `$DSH_HOME/dsh-claude-style/` and must stay inside it. PNG, SVG and WebP files up to 2 MB are accepted. UI uploads live under `branding/presets/<id>/`, so switching presets needs no repeated upload.
- Appearance settings include eight built-in vendor presets (OpenAI, Gemini, Qwen, Kimi Code, ZCode, MiniMax, Grok, Xiaomi MiMo) and let you create, duplicate, rename, select and delete logo presets, replace light and dark images separately, and adjust logo colour. An empty `brandingPreset` follows the active theme's logo, and any earlier standalone global uploads are migrated into a **Current images** preset automatically. Logo and colour selections stay independent.
- UI edits persist in the plugin-managed `appearance-overlays.json` and merge with base YAML by `id`. UI-created or edited records and selection overrides win; records added later to the file are merged in, and base records deleted through the UI do not return after a reload. After a manual configuration edit and reload, unconflicted records follow the file, while conflicts follow the latest UI edit.
- Invalid records are reported and skipped without removing valid ones. A missing or invalid image affects only that image and leaves the other presets and settings UI working.
- `modelOrder` accepts `id`, `brand`, `catalog` and `custom`. Brand order places recognised vendors first and hides descriptions on unrecognised rows. Custom order follows `provider/model` entries in `modelOrderRows`; remaining models follow in ID order.

## Fonts

> The Anthropic fonts have no public release; this repository only offers [copies](https://github.com/euansuuu/dsh-claude-style/tree/master/packages/assets/src/fonts/anthropic) for download and study.

To enable them, install the `.ttf` files on your system, or copy them into `$DSH_HOME/dsh-claude-style/fonts/` (takes effect after a reload).

## Documentation

| Document | Contents |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Repository layout, engine and half boundaries, cross-module invariants |
| [Design tokens](docs/STYLE.md) | The palette, typography, shape, motion and layer rules |
| [Architecture decisions](docs/adr/README.md) | One page per direction: background, decision, consequences, revisiting conditions |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Contributing](CONTRIBUTING.md) | Fix-first contribution flow and change-fragment format |

## License

Except where otherwise stated, this repository is licensed under MIT.

The Sodium rendering engine is licensed under the [PolyForm Shield License 1.0.0](packages/client/src/features/sodium/LICENSE).

## Acknowledgements

- This repository is a modification of [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style): every feature, the architecture and the tests come from the upstream repository, and the Codex-style parts are adjustments made on top of it.
- "Sodium" (钠) is named after Minecraft's [Sodium](https://github.com/CaffeineMC/sodium) rendering mod; this plugin is not affiliated with it.
- The message navigator follows SherUnlocked-4869's [dsh-plugin-msg-nav](https://github.com/SherUnlocked-4869/dsh-plugin-msg-nav) (MIT).
- The animation frames of Deepy the pixel whale come from the Deepy whale theme pack drawn by calmly-eating-bugs ([@wp3171216237](https://github.com/wp3171216237)), and ship with the plugin by the author's permission; GIFs of all 20 animations are in [docs/gifs/](docs/gifs/).
- The whale girl pixel emoji set came with issue #224.
- The enhanced animations in the chat area are modified from [dsh-chat-ux](https://github.com/alm-allen/dsh-chat-ux) (MIT).
- Clawd is a character of Anthropic. Its frames are not covered by the MIT license (see [LICENSE](LICENSE)). This plugin is an unofficial fan work, not affiliated with or endorsed by Anthropic.

## Related projects

> Want to import your Claude Code / Codex session history into DSH and keep the conversation going? Try the upstream author's other plugin, [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import).
