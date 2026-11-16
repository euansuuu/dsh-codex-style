import { USAGE_ROUTE } from '../../constants'
import { localized } from '../../core/i18n'
import { resolveAvatarUrl, resolveDisplayName } from '../../shared/identity'
import type { UsageAnswer, UsageReport } from '@dsh-claude-style/contracts/usage'

const TEXT = {
  title: { zh: '个人主页', en: 'Profile' },
  subtitle: { zh: '本机全部会话的使用记录', en: 'Activity across local sessions' },
  close: { zh: '关闭个人主页', en: 'Close profile' },
  total: { zh: '累计 Token', en: 'Total tokens' },
  peak: { zh: '单日 Token 峰值', en: 'Peak day tokens' },
  longestTask: { zh: '最长任务', en: 'Longest task' },
  longestStreak: { zh: '最长连续活跃天数', en: 'Longest active streak' },
  currentStreak: { zh: '当前连续活跃天数', en: 'Current active streak' },
  days: { zh: '天', en: 'days' },
  day: { zh: '天', en: 'day' },
  activity: { zh: 'Token 活动', en: 'Token activity' },
  activityHint: { zh: '过去一年 · 按本机日期统计', en: 'Past year · local calendar days' },
  loading: { zh: '正在读取本机使用记录…', en: 'Loading local usage…' },
  computing: { zh: '正在汇总本机使用记录…', en: 'Calculating local usage…' },
  error: { zh: '使用记录读取失败，请重新打开个人主页重试。', en: 'Could not load usage. Reopen the profile to retry.' },
  empty: { zh: '暂无本机活动记录。', en: 'No local activity recorded yet.' },
  plugins: { zh: '已安装插件', en: 'Installed plugins' },
  pluginsLoading: { zh: '正在读取已安装插件…', en: 'Loading installed plugins…' },
  pluginsUnavailable: { zh: '目前没有已安装插件的数据接口。', en: 'Installed plugin data is unavailable.' },
  pluginsEmpty: { zh: '暂无已安装插件。', en: 'No plugins installed.' },
  pluginsError: { zh: '已安装插件读取失败，请重新打开个人主页重试。', en: 'Could not load installed plugins. Reopen the profile to retry.' },
  activitySummary: { zh: '过去一年活跃 {days} 天 · 单日峰值 {peak} Token', en: '{days} active days in the past year · peak {peak} tokens in one day' },
  fewer: { zh: '少', en: 'Less' },
  more: { zh: '多', en: 'More' },
} as const

type TextKey = keyof typeof TEXT
const text = (key: TextKey) => localized(TEXT[key])

function dayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function tokenTotal(day: UsageReport['days'][number]) {
  return day.total ?? ((day.input ?? 0) + (day.output ?? 0) + (day.cacheRead ?? 0) + (day.cacheWrite ?? 0))
}

/** The route's day keys describe local calendar days (D43); UTC arithmetic only measures distances between those keys. */
function dayNumber(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

/** Derive every available profile figure from the unfiltered usage report. */
export function accountProfileStatistics(report: UsageReport, today: Date = new Date()) {
  const amounts = new Map<string, number>()
  for (const day of report.days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) continue
    const total = tokenTotal(day)
    if (Number.isFinite(total) && total >= 0) amounts.set(day.date, (amounts.get(day.date) ?? 0) + total)
  }
  const current = dayNumber(dayKey(today))
  const active = [...amounts].filter(([key, total]) => total > 0 && dayNumber(key) <= current).map(([key]) => dayNumber(key)).sort((a, b) => a - b)
  let longestStreak = 0
  let run = 0
  for (let i = 0; i < active.length; i++) {
    run = i > 0 && active[i] === active[i - 1] + 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  }
  let currentStreak = 0
  let expected = active[active.length - 1]
  if (expected === current || expected === current - 1) {
    for (let i = active.length - 1; i >= 0 && active[i] === expected; i--, expected--) currentStreak++
  }
  return {
    total: report.totals.total ?? ((report.totals.input ?? 0) + (report.totals.output ?? 0) + (report.totals.cacheRead ?? 0) + (report.totals.cacheWrite ?? 0)),
    peak: Math.max(0, ...amounts.values()),
    longestStreak,
    currentStreak,
    days: amounts,
  }
}

/** The account row supplies host plugin data and navigation to this page (D43). */
export function createAccountProfilePage(options: {
  loadPlugins(): Promise<{ name: string; title?: string; description?: string }[]> | null
  openPlugin(name: string): void
  returnFocus?(): HTMLElement | null
  displayName?(): string
}) {
  let root: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let generation = 0
  let previousFocus: HTMLElement | null = null

  function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, label?: string) {
    const node = document.createElement(tag)
    node.className = `dsh-claude-profile-${className}`
    if (label !== undefined) node.textContent = label
    return node
  }

  function status(message: string) {
    const node = element('p', 'status', message)
    node.setAttribute('role', 'status')
    return node
  }

  function render(report: UsageReport, target: HTMLElement) {
    const figures = accountProfileStatistics(report)
    const format = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
    const stats = element('div', 'stats')
    const values: [TextKey, string][] = [
      ['total', format.format(figures.total)],
      ['peak', format.format(figures.peak)],
      ['longestTask', '—'],
      ['longestStreak', `${figures.longestStreak} ${text(figures.longestStreak === 1 ? 'day' : 'days')}`],
      ['currentStreak', `${figures.currentStreak} ${text(figures.currentStreak === 1 ? 'day' : 'days')}`],
    ]
    for (const [label, value] of values) {
      const item = element('div', 'stat')
      item.append(element('strong', 'stat-value', value), element('span', 'stat-label', text(label)))
      stats.append(item)
    }
    target.replaceChildren(stats)

    const activity = element('section', 'section')
    activity.append(element('h2', 'section-title', text('activity')), element('p', 'section-note', text('activityHint')))
    if (![...figures.days.values()].some(value => value > 0)) activity.append(status(text('empty')))
    // Keep the calendar visible when no tokens were used: every day is a gray cell.
    {
      const chart = element('div', 'chart')
      chart.setAttribute('role', 'img')
      chart.setAttribute('aria-label', text('activity'))
      const calendar = element('div', 'calendar')
      const cells = element('div', 'heatmap')
      const months = element('div', 'months')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const start = new Date(today)
      start.setDate(today.getDate() - 364)
      start.setDate(start.getDate() - start.getDay())
      const visiblePeak = Math.max(0, ...[...figures.days].filter(([key]) => dayNumber(key) >= dayNumber(dayKey(start)) && dayNumber(key) <= dayNumber(dayKey(today))).map(([, amount]) => amount))
      const peak = Math.max(1, visiblePeak)
      let activeDays = 0
      const count = Math.round((today.getTime() - start.getTime()) / 86400000) + 1
      // The grid spreads its week columns across the card (justify-content:
      // space-between), so a month label hangs at its column's share of the
      // row minus that share of one cell (packages/testing/data/appearance
      // reads the result; 12px is the cell's width).
      const columns = Math.ceil(count / 7)
      for (let offset = 0; offset < count; offset++) {
        const date = new Date(start)
        date.setDate(start.getDate() + offset)
        const key = dayKey(date)
        const amount = figures.days.get(key) ?? 0
        if (amount > 0) activeDays++
        const cell = element('span', 'day')
        cell.dataset.level = amount === 0 ? '0' : String(Math.min(4, Math.max(1, Math.ceil(amount / peak * 4))))
        cell.title = `${key} · ${new Intl.NumberFormat().format(amount)} Token`
        cells.append(cell)
        if (date.getDate() === 1) {
          const share = Math.floor(offset / 7) / (columns - 1) * 100
          const label = element('span', 'month', localized({
            zh: `${date.getMonth() + 1}月`,
            en: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
          }))
          label.style.left = `calc(${share}% - ${share * 0.12}px)`
          months.append(label)
        }
      }
      const legend = element('div', 'legend')
      legend.append(element('span', 'legend-label', text('fewer')))
      for (let level = 0; level <= 4; level++) {
        const swatch = element('span', 'day')
        swatch.dataset.level = String(level)
        legend.append(swatch)
      }
      legend.append(element('span', 'legend-label', text('more')))
      const summary = text('activitySummary').replace('{days}', String(activeDays)).replace('{peak}', new Intl.NumberFormat().format(visiblePeak))
      chart.setAttribute('aria-label', `${text('activity')} · ${summary}`)
      calendar.append(cells, months)
      chart.append(calendar, legend)
      activity.append(element('p', 'summary', summary), chart)
    }
    target.append(activity)
  }

  async function load(target: HTMLElement, serial: number) {
    let polls = 0
    async function read() {
      try {
        const response = await fetch(`${USAGE_ROUTE}?scope=all`, { credentials: 'same-origin', headers: { accept: 'application/json' } })
        if (!response.ok) throw new Error('usage unavailable')
        const answer = await response.json() as UsageAnswer
        if (serial !== generation || root === null) return
        if (answer.ok !== true || answer.error) throw new Error(answer.error || 'usage unavailable')
        if (answer.value) render(answer.value, target)
        else target.replaceChildren(status(answer.computing ? text('computing') : text('empty')))
        if (answer.computing && polls++ < 180) {
          if (answer.value) target.append(status(text('computing')))
          timer = setTimeout(() => { timer = null; void read() }, 800)
        } else if (answer.computing && !answer.value) target.replaceChildren(status(text('error')))
      // The route's failure stays inside this page, with an explicit retry instruction (D12).
      } catch {
        if (serial === generation && root !== null) target.replaceChildren(status(text('error')))
      }
    }
    await read()
  }

  async function loadPluginList(target: HTMLElement, serial: number) {
    try {
      const request = options.loadPlugins()
      if (request === null) {
        target.replaceChildren(status(text('pluginsUnavailable')))
        return
      }
      const plugins = await request
      if (serial !== generation || root === null) return
      if (plugins.length === 0) {
        target.replaceChildren(status(text('pluginsEmpty')))
        return
      }
      const list = element('div', 'plugin-list')
      for (const plugin of plugins.slice(0, 6)) {
        const button = element('button', 'plugin-button')
        button.type = 'button'
        // The cube chip marks the entry as a plugin; the glyph is drawn inline
        // so it takes the palette's tint without an asset request.
        const icon = element('span', 'plugin-icon')
        icon.setAttribute('aria-hidden', 'true')
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/></svg>'
        const body = element('span', 'plugin-text')
        body.append(element('strong', 'plugin-title', plugin.title || plugin.name))
        if (plugin.description) body.append(element('span', 'plugin-description', plugin.description))
        button.append(icon, body)
        button.addEventListener('click', () => { close(); options.openPlugin(plugin.name) })
        list.append(button)
      }
      target.replaceChildren(list)
    // Plugin discovery can fail independently of usage; show the failure in this section (D12).
    } catch {
      if (serial === generation && root !== null) target.replaceChildren(status(text('pluginsError')))
    }
  }

  function close() {
    if (root === null) return
    generation++
    if (timer !== null) clearTimeout(timer)
    timer = null
    root?.remove()
    root = null
    document.removeEventListener('keydown', onKeyDown, true)
    const focusTarget = previousFocus && previousFocus !== document.body && previousFocus.isConnected
      ? previousFocus : options.returnFocus?.()
    focusTarget?.focus()
    previousFocus = null
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
    if (event.key !== 'Tab' || root === null) return
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('button')]
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  function open() {
    if (root !== null) return
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    root = element('div', 'overlay')
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
    root.setAttribute('aria-label', text('title'))
    const page = element('main', 'page')
    const closeButton = element('button', 'close', '×')
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', text('close'))
    closeButton.addEventListener('click', close)
    const header = element('header', 'header')
    const avatar = resolveAvatarUrl()
    if (avatar && URL.canParse(avatar, window.location.href)) {
      const parsed = new URL(avatar, window.location.href)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const image = element('img', 'avatar')
        image.src = parsed.href
        image.alt = ''
        image.referrerPolicy = 'no-referrer'
        image.addEventListener('error', () => image.remove())
        header.append(image)
      }
    }
    header.append(element('h1', 'name', options.displayName?.() || resolveDisplayName() || localized({ zh: '用户', en: 'User' })), element('p', 'subtitle', text('subtitle')))
    const content = element('div', 'content')
    content.append(status(text('loading')))
    const plugins = element('section', 'section')
    plugins.append(element('h2', 'section-title', text('plugins')))
    const pluginContent = element('div', 'plugin-content')
    pluginContent.append(status(text('pluginsLoading')))
    plugins.append(pluginContent)
    page.append(closeButton, header, content, plugins)
    root.append(page)
    document.body.append(root)
    document.addEventListener('keydown', onKeyDown, true)
    closeButton.focus()
    const serial = ++generation
    void load(content, serial)
    void loadPluginList(pluginContent, serial)
  }

  return { open, close, isOpen: () => root !== null, dispose: close }
}
