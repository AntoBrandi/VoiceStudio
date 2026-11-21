import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
try {
  await page.goto((process.env.VOICESTUDIO_UI_URL || 'http://localhost:3912') + '/#/settings/appearance');
  await page.getByRole('link', { name: 'Support', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: 'Support', exact: true }).waitFor();
  for (const name of ['PayPal', 'Ko-fi', 'GitHub Sponsors'])
    assert.equal(await page.getByRole('link', { name, exact: true }).count(), 0);
  assert.equal(await page.getByRole('progressbar').count(), 0);
  assert.equal(
    await page.getByRole('link', { name: 'Report privately', exact: true }).getAttribute('href'),
    'https://github.com/debpalash/VoiceStudio/security/advisories/new',
  );
  console.log(
    'Support navigation, no donation links and private security destination passed; no external page opened.',
  );
} finally {
  await browser.close();
}
