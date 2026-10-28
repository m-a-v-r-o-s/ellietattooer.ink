// node demo/promo.mjs: screen-records the live site in a phone viewport and builds a 1080x1920
// Instagram reel/story in demo/out/, with the beat from demo/beat.py underneath.
// Frames come from Chromium's screencast (sharper than Playwright's recorder), cut with ffmpeg.
// Read-only tour: it adds one item to the cart in the browser, never checks out.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'demo/out')
const TMP = mkdtempSync(join(tmpdir(), 'elli-promo-')) // frames, left for the OS to clear
const BASE = process.env.BASE || 'https://www.ellietattooer.com'
const SPEED = 1.3 // playback speed-up of the recording
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
const now = () => Date.now() / 1000
const wait = ms => new Promise(r => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

function record(page) {
  const frames = []
  return page.context().newCDPSession(page).then(async cdp => {
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const file = join(TMP, String(frames.length).padStart(6, '0') + '.jpg')
      writeFileSync(file, Buffer.from(data, 'base64'))
      frames.push({ file, t: metadata.timestamp })
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920 })
    return frames
  })
}

// Touch ripple, since headless capture shows no finger. Cookie choice pre-set so the banner stays away.
function overlay() {
  localStorage.setItem('ellie_cookie_consent_v1', JSON.stringify({ analytics: false }))
  addEventListener('DOMContentLoaded', () => {
    addEventListener('pointerdown', e => {
      const r = document.createElement('div')
      Object.assign(r.style, { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: '46px', height: '46px', borderRadius: '50%', background: 'rgb(255 255 255 / 55%)', border: '2px solid rgb(20 17 18 / 35%)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 99999 })
      document.body.appendChild(r)
      r.animate([{ transform: 'translate(-50%, -50%) scale(.5)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }], { duration: 500, easing: 'ease-out' }).onfinish = () => r.remove()
    }, true)
  })
}

async function tap(page, selector) {
  const b = await page.locator(selector).first().boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down(); await wait(70); await page.mouse.up()
  await wait(250)
}

async function drag(page, selector, dx, dy, steps = 18) {
  const b = await page.locator(selector).first().boundingBox()
  const x = b.x + b.width / 2, y = b.y + b.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  // paced, then held still before release, so it is a visible drag and not a fling
  for (let i = 1; i <= steps; i++) { await page.mouse.move(x + dx * i / steps, y + dy * i / steps); await wait(16) }
  await wait(300)
  await page.mouse.up()
}

// Eased glide to an element (or a y offset), with a fixed duration so the cut is predictable.
const glide = (page, target, ms) => page.evaluate(([target, ms]) => new Promise(done => {
  const from = scrollY
  const to = typeof target === 'number' ? target : document.querySelector(target).getBoundingClientRect().top + scrollY - 64
  const t0 = performance.now()
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms)
    scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' })
    p < 1 ? requestAnimationFrame(step) : done()
  }
  requestAnimationFrame(step)
}), [target, ms])

// ---------- run ----------

const browser = await chromium.launch({ executablePath: CHROME })
try {
  const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 1080 / 405, isMobile: true, hasTouch: true })
  await ctx.addInitScript(overlay)
  const page = await ctx.newPage()
  // Warm the cache so images are in before the take.
  await page.goto(BASE, { waitUntil: 'load' })
  for (const s of ['#portfolio', '#about', '#shop', '#findme', 'footer']) await glide(page, s, 250)
  await wait(2500)
  await glide(page, 0, 1)

  const frames = await record(page)
  await page.reload({ waitUntil: 'load' })
  const start = now()
  await page.waitForSelector('.c-sticker')
  await wait(1500)

  // Hero: drag the Ritual sticker down over the seam (its text turns black on the white)
  await drag(page, '.c-sticker:has(img[src*="ritual"])', -40, 150, 40)
  await wait(900)

  // Menu to the flash wall
  await tap(page, '.c-menu-btn')
  await wait(450)
  await tap(page, '#c-menu a:has-text("Flash wall")')
  await wait(1100)
  await glide(page, '.c-tabs', 500)
  await tap(page, '.c-tabs button >> nth=1')
  await wait(700)
  const skull = '.c-tile[aria-label*="hooded skull"]' // the pink panther is the next photo
  await glide(page, skull, 600)
  await wait(250)
  await tap(page, skull)
  await wait(1100)
  await tap(page, '.lightbox-next')
  await wait(1100)
  await tap(page, '.lightbox-close')
  await wait(400)

  // Get tattooed
  await glide(page, '#about', 900)
  await wait(1000)
  await glide(page, '#about .c-me', 700)
  await wait(500)

  // Merch: add the last item to the cart
  await glide(page, '#shop', 900)
  await wait(500)
  const card = '.c-card:last-child'
  await glide(page, card, 600)
  await wait(300)
  await tap(page, `${card} .c-big.mint`)
  await wait(1200)

  // Studio and footer, then back to the top so the reel loops
  await glide(page, '#findme', 1000)
  await wait(1100)
  await glide(page, 'footer', 700)
  await wait(700)
  await glide(page, 0, 1100)
  await wait(1200)
  const end = now()
  await wait(300)
  console.log(`frames: ${frames.length}, take ${(end - start).toFixed(1)}s, video ${((end - start) / SPEED).toFixed(1)}s`)

  // ---------- encode ----------
  const lines = ['ffconcat version 1.0']
  const first = Math.max(0, frames.findLastIndex(f => f.t <= start))
  for (let i = first; i < frames.length && frames[i].t < end; i++) {
    const a = Math.max(frames[i].t, start), b = Math.min(frames[i + 1]?.t ?? end, end)
    if (b - a > 0.001) lines.push(`file '${frames[i].file}'`, `duration ${(b - a).toFixed(4)}`)
  }
  lines.push(lines.at(-2)) // the concat demuxer drops the last entry's duration unless the file is repeated
  const list = join(TMP, 'frames.txt')
  writeFileSync(list, lines.join('\n'))
  const silent = join(TMP, 'silent.mp4')
  const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `setpts=PTS/${SPEED},fps=30,scale=1080:1920:flags=lanczos,setsar=1`,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent])
  const secs = (end - start) / SPEED
  const beat = join(TMP, 'beat.wav')
  execFileSync('python3', [join(ROOT, 'demo/beat.py'), beat, secs.toFixed(2)], { stdio: 'inherit' })
  ffmpeg(['-i', silent, '-i', beat, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', join(OUT, 'elli-reel.mp4')])
  console.log(`done: ${join(OUT, 'elli-reel.mp4')}`)
} finally {
  await browser.close()
}
