import { expect, type Page, test } from '@playwright/test'

async function bankLetters(page: Page, count: number) {
	for (let i = 0; i < count; i++) {
		await page.getByRole('button', { name: /^Bank/ }).filter({ visible: true }).first().click()
		await expect(page.getByTestId('banked-count')).toHaveText(`${i + 1}/8`)
	}
}

test('home page explains the game and links to both modes', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1 })).toContainText('WORDBALL')
	await expect(page.getByRole('link', { name: "Play today's challenge" })).toBeVisible()
	await expect(page.getByRole('link', { name: 'Practice' })).toBeVisible()
	await expect(page.getByLabel('How to play')).toContainText('Spell')
})

test('a shot aimed down banks the letter', async ({ page }) => {
	await page.goto('/play?mode=practice')
	const canvas = page.locator('canvas')
	await expect(canvas).toBeVisible()
	const box = await canvas.boundingBox()
	if (!box) throw new Error('canvas has no size')
	// The ball sits at (250, 520) in a 500 × 800 arena; pulling up fires it down
	const x = box.x + box.width * 0.5
	const y = box.y + box.height * 0.65
	await page.mouse.move(x, y)
	await page.mouse.down()
	await page.mouse.move(x, y - box.height * 0.08, { steps: 5 })
	await page.mouse.up()
	await expect(page.getByTestId('banked-count')).toHaveText('1/8', { timeout: 5_000 })
})

test('a daily game runs from skill round to the leaderboard', async ({ page }) => {
	await page.goto('/play?mode=daily')
	await bankLetters(page, 8)

	// Bank full ends the skill round and opens the word round
	await expect(page.getByLabel('Word round')).toBeVisible({ timeout: 10_000 })
	await expect(page.getByRole('button', { name: "I'm done" })).toBeEnabled()
	await page.keyboard.type('zzz')
	await page.getByRole('button', { name: "I'm done" }).click()

	await expect(page.getByTestId('total-score')).toBeVisible()
	const name = `e2e-${test.info().project.name}`
	await page.getByPlaceholder('Your name').fill(name)
	await page.getByRole('button', { name: 'Post score' }).click()
	await expect(page.getByText(/You're #\d+ today/)).toBeVisible()

	await page.getByRole('link', { name: 'See the leaderboard' }).click()
	await expect(page.getByRole('cell', { name })).toHaveCount(2)
})

test('keyboard players can bank with B', async ({ page, isMobile }) => {
	test.skip(isMobile, 'no physical keyboard')
	await page.goto('/play?mode=practice')
	await expect(page.locator('canvas')).toBeVisible()
	await page.keyboard.press('b')
	await expect(page.getByTestId('banked-count')).toHaveText('1/8')
})

test('then and now page compares the versions', async ({ page }) => {
	await page.goto('/about')
	await expect(page.getByRole('table')).toContainText('2019')
	await expect(page.getByRole('link', { name: 'browse the 2019 version' })).toBeVisible()
})
