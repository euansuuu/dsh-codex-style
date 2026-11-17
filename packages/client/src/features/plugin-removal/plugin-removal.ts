import { observeMatches } from '@dsh-claude-style/engine/bus'
import type { MatchList } from '@dsh-claude-style/engine/bus'
import { hostRemotePluginManager } from '@dsh-claude-style/engine/host'
import type { HostContext } from '@dsh-claude-style/engine/host'
import { PACKAGE_NAME } from '../../constants'
import { copy } from './copy'
import type { FeatureUi } from '../../core/feature'
import type manifest from './plugin-removal.manifest'

/**
 * The host's installed-plugins page (设置 → 插件) gains an uninstall control per
 * card. The removal goes through the host's own plugin manager
 * (`remote.pluginManager.removeBundle(name)`), the same service the page's
 * enable/disable toggles speak to, so the uninstall is the host's own and the
 * runner unloads the bundle the same way an install applies it.
 *
 * The cards are the host's own React markup with hashed class names and no
 * stable attribute of theirs to key on (D3): a card is matched by its shape —
 * a wrapper holding both an enable/disable switch and a 「查看 …」 title button —
 * and the bundle's name is resolved through the manager's own list, by the
 * title the card shows. The list is also the filter: the page's built-in
 * plugins carry toggles of their own but are no bundles, so only cards whose
 * title the manager lists — the installed ones — are decorated. The skin's own
 * bundle is guarded: removing the running plugin takes the page down with it.
 */

/** The mark a decorated card carries, so a sweep never decorates it twice. */
const MARK = 'data-dsh-claude-plugin-removal'
/** The control the removal button's flow has reached, in order. */
const CONFIRMING = 'data-confirming'
const REMOVING = 'data-removing'
const FAILED = 'data-failed'
/** The title button's aria-label prefix on the host's installed cards. */
const SEEING = '查看'

/** Whether a title button is one of the host's installed-card openers. */
function isCardTitle(node: HTMLElement) {
  const label = node.getAttribute('aria-label') || ''
  return node.tagName === 'BUTTON' && label.startsWith(SEEING)
}

/** The installed card a switch belongs to, or null when it sits elsewhere. */
function cardOf(toggle: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = toggle
  for (let depth = 0; node && depth < 8; depth++) {
    if ([...node.querySelectorAll('button')].some(isCardTitle)) return node
    node = node.parentElement
  }
  return null
}

/** The card's display title, without the opener's 查看 prefix. */
function titleOf(card: HTMLElement) {
  const opener = [...card.querySelectorAll('button')].find(isCardTitle)
  const label = opener?.getAttribute('aria-label') || ''
  return label.startsWith(SEEING) ? label.slice(SEEING.length).trim() : (opener?.textContent || '').trim()
}

/** Show a failure on the control for a moment, then hand it back. */
function failForAWhile(button: HTMLElement, message: string) {
  button.removeAttribute(REMOVING)
  button.setAttribute(FAILED, '')
  button.setAttribute('aria-label', message)
  setTimeout(() => {
    if (button.isConnected) button.removeAttribute(FAILED)
  }, 3000)
}

export function install(ctx: HostContext, ui: FeatureUi<typeof manifest>) {
  const manager = hostRemotePluginManager(ctx)
  /** The installed bundles, keyed by the title their card shows. */
  let namesByTitle: Map<string, string> | null = null
  /** The controls whose confirm step is standing, awaiting the second press.
      按行：条目随按钮脱离文档清除，3 秒确认窗到期时也会自行收回。 */
  const confirming = new Set<HTMLElement>()

  /** List the manager's bundles once it answers; a failed answer retries on the next pass. */
  async function refreshNames() {
    if (namesByTitle !== null || !manager) return
    const listed = await manager.listBundles()
    if (!listed.ok) return
    namesByTitle = new Map()
    for (const bundle of listed.value) {
      const title = typeof bundle.meta?.title === 'string' ? bundle.meta.title : ''
      if (title !== '') namesByTitle.set(title, bundle.name)
    }
  }

  /** The removal: a guarded call to the host's manager, then a reload. */
  async function remove(button: HTMLElement, name: string) {
    if (!manager) return
    button.removeAttribute(CONFIRMING)
    confirming.delete(button)
    button.setAttribute(REMOVING, '')
    button.setAttribute('aria-label', copy('removing'))
    if (name === PACKAGE_NAME) {
      failForAWhile(button, copy('selfGuard'))
      return
    }
    const result = await manager.removeBundle(name).catch(() => null)
    if (!button.isConnected) return
    if (result !== null && result.ok) {
      // The runner unloads the bundle on its own schedule; the page's list
      // reads the profile again after a reload, so the removed card is gone.
      button.setAttribute('aria-label', copy('restartNote'))
      setTimeout(() => location.reload(), 600)
      return
    }
    failForAWhile(button, copy('removeFailed'))
  }

  /** The uninstall control in a card's title row, with its two-step confirm. */
  function decorate(card: HTMLElement, title: string) {
    const opener = [...card.querySelectorAll('button')].find(isCardTitle)
    const titleRow = opener?.parentElement
    if (titleRow === undefined || titleRow === null) return
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'dsh-claude-plugin-remove'
    button.setAttribute('aria-label', copy('removeLabel'))
    button.setAttribute('title', copy('removeLabel'))
    button.innerHTML =
      '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4 4.5l.8 9a1.4 1.4 0 0 0 1.4 1.3h3.6a1.4 1.4 0 0 0 1.4-1.3l.8-9M6.6 7v5.5M9.4 7v5.5"/>' +
      '</svg>'
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      if (confirming.has(button)) {
        confirming.delete(button)
        const name = namesByTitle?.get(title)
        if (name === undefined) {
          failForAWhile(button, copy('removeFailed'))
          return
        }
        void remove(button, name)
        return
      }
      confirming.add(button)
      button.setAttribute(CONFIRMING, '')
      button.setAttribute('aria-label', copy('removeConfirm'))
      setTimeout(() => {
        if (button.isConnected && confirming.has(button)) {
          confirming.delete(button)
          button.removeAttribute(CONFIRMING)
        }
      }, 3000)
    })
    titleRow.append(button)
    card.setAttribute(MARK, '')
  }

  /** Decorate every installed card the page shows that is not decorated yet. */
  function sync() {
    // The titles come from the manager's own list: until it lands, and on a
    // page where the manager answers nothing, no card is decorated.
    if (namesByTitle === null) {
      void refreshNames()
      return
    }
    for (const toggle of switches.all()) {
      const card = cardOf(toggle)
      if (card === null || card.hasAttribute(MARK)) continue
      if (card.querySelector('.dsh-claude-plugin-remove') !== null) {
        card.setAttribute(MARK, '')
        continue
      }
      const title = titleOf(card)
      if (title === '' || !namesByTitle.has(title)) continue
      decorate(card, title)
    }
  }

  const switches: MatchList<HTMLElement> = observeMatches('[role="switch"]')
  void refreshNames()

  ui.pluginRemoval = { sync }

  return () => {
    confirming.clear()
    for (const card of document.querySelectorAll(`[${MARK}]`)) card.querySelector('.dsh-claude-plugin-remove')?.remove()
    switches.release()
    delete ui.pluginRemoval
  }
}
