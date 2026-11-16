/**
 * Profile statistics use the plugin's unfiltered, local calendar usage report.
 *
 * @capability account
 * @features account
 * @risk The profile invents a streak or misstates a peak when usage days are sparse or yesterday was the latest active day.
 */
import { expect, test } from 'vitest'
import { accountProfileStatistics } from '@dsh-claude-style/client/pure'
import type { UsageReport } from '@dsh-claude-style/contracts/usage'

const report: UsageReport = {
  source: 'local', computedAt: 0, firstDay: '2026-11-10', lastDay: '2026-11-15', models: [],
  totals: { input: 10, output: 25, cacheRead: 5 },
  days: [
    { date: '2026-11-15', input: 8, output: 7 },
    { date: '2026-11-10', total: 20 },
    { date: '2026-11-13', total: 12 },
    { date: '2026-11-14', total: 18 },
  ],
}

test('the page reports local token totals, the peak day and two consecutive runs', () => {
  const value = accountProfileStatistics(report, new Date(2026, 10, 15))
  expect(value.total).toBe(40)
  expect(value.peak).toBe(20)
  expect(value.longestStreak).toBe(3)
  expect(value.currentStreak).toBe(3)
})

test('yesterday keeps a streak alive; a missing day ends it', () => {
  expect(accountProfileStatistics(report, new Date(2026, 10, 16)).currentStreak).toBe(3)
  expect(accountProfileStatistics(report, new Date(2026, 10, 17)).currentStreak).toBe(0)
})

test('zero-token and future dates cannot lengthen a usage streak', () => {
  const days = [
    ...report.days,
    { date: '2026-11-11', total: 0 },
    { date: '2026-11-12', total: 0 },
    { date: '2026-11-16', total: 1 },
    { date: '2026-11-17', total: 1 },
  ]
  const value = accountProfileStatistics({ ...report, days }, new Date(2026, 10, 15))
  expect(value.longestStreak).toBe(3)
  expect(value.currentStreak).toBe(3)
})

test('an empty report has no peak or streak', () => {
  const value = accountProfileStatistics({ ...report, days: [], totals: {} }, new Date(2026, 10, 15))
  expect([value.total, value.peak, value.longestStreak, value.currentStreak]).toEqual([0, 0, 0, 0])
})
