/**
 * The words of the sidebar's workspace directory under the DeepSeek brand: the
 * section heading and each folder's expand control read codex's vocabulary
 * where the host spells its own, and a flip to the Claude brand hands the
 * host's words back without a reload.
 *
 * @capability workspace-words
 * @features workspace-words
 * @risk The DeepSeek brand spells the directory Claude's way — the heading says 工作区 where codex says 项目, or the brand flip leaves the other brand's words standing.
 */
import { spec, surface } from '../../fixtures/behaviour.mjs'

const SECTION_LABEL = surface('sidebar.section-label')
const EXPANDER = surface('sidebar.session-overflow')

/**
 * The stand-in host's workspace section, in the shape the smoke's own blocks
 * stand it: the host's class names are assembled at runtime so this file
 * spells no mark (the same escape the engine uses). The expand control is the
 * host's own button under a folder's sessions, carrying its count inside its
 * words the way the workspace browser writes it.
 */
const HOST_CLASS = {
  root: '_root_n_' + '1',
  section: '_sectionHeader_' + 'w1_1',
  label: '_sectionLabel_' + 'w1_1',
  wide: '_wide_' + 'w1_1',
  area: '_listArea_' + 'w1_1',
  project: '_projectRow_' + 'w1_1',
  expander: '_sessionOverflowButton_' + 'w1_1',
}

/**
 * Stand the host's directory: a section heading, one folder and the expand
 * control at its foot. A previous test's mount leaves first, so every test
 * reads the boxes it stood itself.
 */
async function setup(t, words) {
  await t.page.evaluate(({ classes, words }) => {
    window.__wordsSidebar?.remove()
    const sidebar = document.createElement('div')
    sidebar.setAttribute('data-' + 'slot', 'sidebar')
    sidebar.innerHTML = '<div class="' + classes.root + '"><div class="' + classes.root + '" style="display:flex;flex-direction:column">' +
      '<div class="' + classes.section + '" style="display:flex;align-items:center;width:100%"><span class="' + classes.label + ' ' + classes.wide + '">' + words.heading + '</span></div>' +
      '<div role="tree" class="' + classes.area + '"><div data-' + 'row-key="w1" class="' + classes.project + '">project</div>' +
      '<button type="button" class="' + classes.expander + '" data-' + 'row-key="overflow:w1" aria-expanded="false">' + words.expand + '</button></div></div></div>'
    window.__wordsSidebar = sidebar
    document.body.appendChild(sidebar)
  }, { classes: HOST_CLASS, words })
  await t.settle()
}

/** Ask the page for a pass, the way the host's own re-render would: a DOM change nothing reads, then the settle. */
async function hostPass(t) {
  await t.page.evaluate(() => document.body.appendChild(document.createElement('i')))
  await t.settle()
}

/** The directory's words as the reader reads them. */
function readWords(t) {
  return t.page.evaluate(([label, expander]) => ({
    heading: document.querySelector(label)?.textContent ?? null,
    expand: document.querySelector(expander)?.textContent ?? null,
  }), [SECTION_LABEL, EXPANDER])
}

export default spec({ page: 'switches' }, ({ test }) => {
  test('the shipped DeepSeek brand rewords the heading and the expand control', async (t) => {
    await setup(t, { heading: 'Workspaces', expand: 'Show 3 more sessions' })
    t.expectThat.equal(await readWords(t), { heading: 'Projects', expand: 'Show all' }, 'the directory says codex\'s words')
  })

  test('a host re-render with its own words is reworded on the next pass', async (t) => {
    await setup(t, { heading: 'Workspaces', expand: 'Show 3 more sessions' })
    t.expectThat.equal((await readWords(t)).expand, 'Show all', 'the expand control is reworded first')
    await t.page.evaluate((expander) => {
      document.querySelector(expander).textContent = 'Show 7 more sessions'
    }, EXPANDER)
    await hostPass(t)
    t.expectThat.equal((await readWords(t)).expand, 'Show all', 'the new count is reworded too')
    t.expectThat.equal((await readWords(t)).heading, 'Projects', 'the heading stays reworded')
  })

  test('the expand control\'s other word stands while the folder is open, and the next shipped line is reworded', async (t) => {
    await setup(t, { heading: 'Workspaces', expand: 'Show 3 more sessions' })
    t.expectThat.equal((await readWords(t)).expand, 'Show all', 'the fold starts reworded')
    // The host writes its collapse word while the folder stands open.
    await t.page.evaluate((expander) => {
      document.querySelector(expander).textContent = 'Show less'
    }, EXPANDER)
    await hostPass(t)
    t.expectThat.equal((await readWords(t)).expand, 'Show less', 'the host\'s collapse word is left alone')
    await t.page.evaluate((expander) => {
      document.querySelector(expander).textContent = 'Show 3 more sessions'
    }, EXPANDER)
    await hostPass(t)
    t.expectThat.equal((await readWords(t)).expand, 'Show all', 'closing the folder brings the rewording back')
  })

  test('a flip to the Claude brand hands the host\'s words back, and back again rewords', async (t) => {
    await setup(t, { heading: 'Workspaces', expand: 'Show 3 more sessions' })
    t.expectThat.equal(await readWords(t), { heading: 'Projects', expand: 'Show all' }, 'the directory starts reworded')
    await t.prefs({ brand: 'claude' })
    t.expectThat.equal(await readWords(t), { heading: 'Workspaces', expand: 'Show 3 more sessions' }, 'the Claude brand keeps the host\'s words')
    await t.page.evaluate((expander) => {
      document.querySelector(expander).textContent = 'Show 5 more sessions'
    }, EXPANDER)
    await hostPass(t)
    t.expectThat.equal((await readWords(t)).expand, 'Show 5 more sessions', 'the Claude brand leaves the host\'s new count alone')
    await t.prefs({ brand: 'deepseek' })
    t.expectThat.equal(await readWords(t), { heading: 'Projects', expand: 'Show all' }, 'the DeepSeek brand rewords again, live')
  })

  test('the Chinese directory reads codex\'s Chinese words', async (t) => {
    await t.page.evaluate(() => window.__dshSmokeHost.setSmokeLocale('zh'))
    await setup(t, { heading: '工作区', expand: '展开其余 6 个会话' })
    t.expectThat.equal(await readWords(t), { heading: '项目', expand: '展开显示' }, 'the Chinese directory says codex\'s words')
    await t.prefs({ brand: 'claude' })
    t.expectThat.equal(await readWords(t), { heading: '工作区', expand: '展开其余 6 个会话' }, 'the Claude brand keeps the host\'s Chinese words')
    await t.page.evaluate(() => window.__dshSmokeHost.setSmokeLocale('en'))
    await t.prefs({ brand: 'deepseek' })
  })
})
