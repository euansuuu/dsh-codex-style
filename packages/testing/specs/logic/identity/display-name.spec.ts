/**
 * The name the account surfaces show: the reader's own nickname, then the
 * account's, then the launcher's; the machine's user name only on a host with
 * no account, and nothing at all for a signed-in account that carries no name
 * — the host's own label stands there instead.
 *
 * @capability identity
 * @features account
 * @risk A signed-in reader sees the machine's Windows user name on the account row where their account identity belongs.
 */
import { expect, test } from 'vitest'
import { pickDisplayName } from '@dsh-claude-style/client/pure'

const base = { custom: '', account: '', launcher: '', signedIn: false, osName: '35161' }

test('the reader\'s own nickname outranks every other name', () => {
  expect(pickDisplayName({ ...base, custom: 'Ada', account: 'Account', launcher: 'Launcher', signedIn: true })).toBe('Ada')
})

test('a signed-in account outranks the launcher and the machine', () => {
  expect(pickDisplayName({ ...base, account: 'Ada', launcher: 'Launcher', signedIn: true })).toBe('Ada')
})

test('the launcher names a host with no account', () => {
  expect(pickDisplayName({ ...base, launcher: 'Ada' })).toBe('Ada')
})

test('a host with no account falls back to the machine\'s user name', () => {
  expect(pickDisplayName({ ...base })).toBe('35161')
})

test('a signed-in account with no name resolves to nothing, so the host\'s own label shows', () => {
  expect(pickDisplayName({ ...base, signedIn: true })).toBe('')
})
