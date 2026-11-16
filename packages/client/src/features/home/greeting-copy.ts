import { BRAND_CLAUDE, HOME_LAYOUT_STUDIO } from '../../constants'
import { getUsername } from '../../shared/identity'
import { readPrefs } from '../../core/prefs'
import { pickHeroGreeting, pickStudioGreeting } from './greetings'

/**
 * The hero headline's greeting: the studio dashboard shows one fixed line,
 * while the classic hero draws from the clock slot's welcomes, renewed each
 * time the page comes back to the hero so a session left and reopened reads
 * a different line.
 *
 * The words belong to the brand (D96's mark tier decides what the page calls
 * itself): the Claude brand speaks Claude's own greetings, while the DeepSeek
 * brand hands the headline back to the host, whose line is DeepSeek's own
 * official copy in whichever locale the shell runs. A brand flip mid-session
 * restores the host's line before the pass returns, so the swap never leaves
 * the other brand's words standing.
 */
export function createGreetingCopy() {
  /** The classic hero's draw, renewed on every return to the hero page. */
  let draw = Math.random()
  let wasHero = false
  /** Each greeting span this copy has written, with the host's own line it replaced. */
  const replaced = new Map<Element, { host: string, written: string }>()

  /** Hand the host's own lines back to the spans that still show this copy's. */
  function restore() {
    for (const [span, line] of replaced) {
      if (span.isConnected && span.textContent === line.written) span.textContent = line.host
    }
    replaced.clear()
  }

  return {
    /** One pass: the headline reads the greeting the layout and the clock pick. */
    sync(hero: boolean) {
      if (hero && !wasHero) draw = Math.random()
      wasHero = hero
      if (readPrefs().brand !== BRAND_CLAUDE) {
        restore()
        return
      }
      const greeting = readPrefs().homeLayout === HOME_LAYOUT_STUDIO
        ? pickStudioGreeting(getUsername())
        : pickHeroGreeting(getUsername(), draw)
      for (const span of replaced.keys()) if (!span.isConnected) replaced.delete(span)
      // The host renders one title group per hero variant; the first span of
      // each is the greeting (a preview badge may sit before it).
      const groups = document.querySelectorAll('[data-dsh-claude-part~="hero-title-group"]')
      for (let i = 0; i < groups.length; i++) {
        const spans = groups[i].children
        for (let j = 0; j < spans.length; j++) {
          const span = spans[j]
          const cls = span.getAttribute('class') || ''
          if (cls.includes('previewBadge')) continue
          if (span.textContent !== greeting) {
            const before = replaced.get(span)
            // A span the host rewrote since the last pass carries a host line again.
            const host = before === undefined || span.textContent !== before.written ? span.textContent ?? '' : before.host
            span.textContent = greeting
            replaced.set(span, { host, written: greeting })
          }
          break
        }
      }
    },
    restore,
  }
}
