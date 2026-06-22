import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const [url = 'http://localhost:3000', label = ''] = process.argv.slice(2)
const dir = path.join(process.cwd(), 'temporary screenshots')
if (!fs.existsSync(dir)) fs.mkdirSync(dir)

const existing = fs.readdirSync(dir).filter(f => f.match(/^screenshot-\d+/))
const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] || '0'))
const next = nums.length ? Math.max(...nums) + 1 : 1
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`
const outPath = path.join(dir, filename)

const puppeteerPath = path.join(process.cwd(), 'node_modules/puppeteer-core')
const chromePath = '/Users/nicholaswoo/.cache/puppeteer/chrome/mac_arm-149.0.7827.22/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

const script = `
const puppeteer = require(${JSON.stringify(puppeteerPath)})
;(async () => {
  const browser = await puppeteer.launch({
    executablePath: ${JSON.stringify(chromePath)},
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2 })
  await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: ${JSON.stringify(outPath)}, fullPage: false })
  await browser.close()
  console.log('Saved: ' + ${JSON.stringify(filename)})
})()
`
const tmpScript = '/tmp/ss-script.cjs'
fs.writeFileSync(tmpScript, script)
execSync(`node ${tmpScript}`, { stdio: 'inherit' })
