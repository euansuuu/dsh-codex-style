import { observeMatches } from '@dsh-claude-style/engine/bus'
import type { MatchList } from '@dsh-claude-style/engine/bus'
import type { HostContext } from '@dsh-claude-style/engine/host'
import { copy } from './copy'
import type { FeatureUi } from '../../core/feature'
import type manifest from './workspace-words.manifest'

/**
 * The words of the sidebar's workspace directory under the DeepSeek brand
 * (features/workspace-words/workspace-words.manifest.ts pins this feature to
 * that brand, so a brand flip tears it down and its teardown hands the host's
 * words back): the directory reads the way codex's does, whose sidebar the
 * reader knows — the section heading says 「项目」 where the host says
 * 「工作区」, and each folder's expand control says 「展开显示」 where the
 * host spells the count out.
 *
 * Both seats are located by their part marks (D3); the shipped words are read
 * only to decide whether a node still carries its host line, the way the
 * composer's hint layer does (features/composer/placeholder-copy.ts). A node
 * the host re-renders with its own words is re-reworded on the next pass, and
 * the count the host writes into the expand control makes that happen whenever
 * it changes.
 */

/** The host's own heading words in the locales this skin rewords. */
const HEADING_WORDS = ['工作区', 'Workspaces']
/** The Chinese expand wording's stem, which carries the count inside it. */
const EXPAND_ZH = '展开其余'
/** The English expand wording, with its count. */
const EXPAND_EN = /^Show \d+ more sessions$/

/** Whether a heading node's text is the host's own word for the directory. */
function isHeadingWord(text: string) {
  return HEADING_WORDS.includes(text)
}

/** Whether an expand node's text is the host's own wording for the rest of a folder. */
function isExpandWord(text: string) {
  return text.startsWith(EXPAND_ZH) || EXPAND_EN.test(text)
}

export function install(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  /** The sidebar's section headings, kept current by the bus (D40). */
  const headings: MatchList<HTMLElement> = observeMatches('[data-dsh-claude-part~="section-label"]')
  /** The folder expand controls the workspace browser draws, from the same source. */
  const expanders: MatchList<HTMLElement> = observeMatches('[data-dsh-claude-part~="session-overflow"]')
  /**
   * Each node this feature reworded, with the host's own line it replaced —
   * a per-generation table, emptied by the teardown and the restore it runs.
   */
  const replaced = new Map<HTMLElement, { host: string, written: string }>()

  /**
   * Put this brand's word on one node. A node this feature already reworded
   * keeps its recorded host line and follows the copy (a locale flip); a node
   * still carrying the host's same shipped line is reworded with that line
   * kept; and a node holding another of the host's words — the expand
   * control's 收起 while its folder stands open — is left alone, its entry
   * dropped so the next shipped line starts over.
   */
  function place(node: HTMLElement, target: string, shipped: boolean) {
    const before = replaced.get(node)
    if (before !== undefined && node.textContent === before.written) {
      if (node.textContent !== target) {
        node.textContent = target
        replaced.set(node, { host: before.host, written: target })
      }
      return
    }
    if (!shipped) {
      replaced.delete(node)
      return
    }
    // The shipped line standing here is the host's own, and the one the
    // restore and any later re-render are measured against.
    const host = node.textContent ?? ''
    node.textContent = target
    replaced.set(node, { host, written: target })
  }

  /** One pass: reword every shipped line the directory carries. */
  function sync() {
    for (const node of replaced.keys()) if (!node.isConnected) replaced.delete(node)
    for (const heading of headings.all()) {
      place(heading, copy('directoryHeading'), isHeadingWord((heading.textContent ?? '').trim()))
    }
    for (const expander of expanders.all()) {
      place(expander, copy('directoryExpand'), isExpandWord((expander.textContent ?? '').trim()))
    }
  }

  /** Hand the host's own words back to the nodes that still show this feature's. */
  function restore() {
    for (const [node, line] of replaced) {
      if (node.isConnected && node.textContent === line.written) node.textContent = line.host
    }
    replaced.clear()
  }

  ui.workspaceWords = { sync }

  return () => {
    restore()
    headings.release()
    expanders.release()
    delete ui.workspaceWords
  }
}
