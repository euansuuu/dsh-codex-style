/**
 * The name the skin's account surfaces show, from the sources in their
 * precedence order (shared/identity.ts supplies the values).
 *
 * The machine's user name is the last resort of a host with no account: the
 * account is the reader's identity there. A signed-in account with no name of
 * its own resolves to nothing, so the surfaces show what the host itself shows
 * — its own label — rather than the Windows user the reader never chose.
 */
export interface DisplayNameSources {
  /** The reader's own nickname from the settings, or ''. */
  custom: string
  /** The account profile's name or masked contact, or ''. */
  account: string
  /** The launcher's account name, or ''. */
  launcher: string
  /** Whether the host reports a stored account credential. */
  signedIn: boolean
  /** The machine's user name, from the probe cache and the live answer. */
  osName: string
}

export function pickDisplayName(sources: DisplayNameSources): string {
  if (sources.custom) return sources.custom
  if (sources.account) return sources.account
  if (sources.launcher) return sources.launcher
  if (sources.signedIn) return ''
  return sources.osName
}
