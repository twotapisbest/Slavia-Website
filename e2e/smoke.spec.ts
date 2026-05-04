import { expect, test } from '@playwright/test'

const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 }

test.describe('smoke publiczne', () => {
  test('strona główna odpowiada', async ({ page }) => {
    const res = await page.goto('/', gotoOpts)
    expect(res?.ok()).toBeTruthy()
  })

  test('trasę publiczną (ogłoszenia) można otworzyć', async ({ page }) => {
    await page.goto('/ogloszenia', gotoOpts)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('ochrona tras', () => {
  test('import SA przekierowuje na logowanie bez sesji', async ({ page }) => {
    await page.goto('/superadmin/import', gotoOpts)
    await expect(page).toHaveURL(/\/logowanie/)
  })
})
