import { expect, test } from "@playwright/test";

test("form fields update the agreement preview", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
  await page.getByLabel("Nama pekerja").fill("Budi Santoso");
  await page.getByLabel("Tempat lahir").fill("Pasuruan");
  await page.getByLabel("No. KTP").fill("3514123456780001");
  await page.getByLabel("No. HP").fill("081234567890");
  await page.getByLabel("Bagian pekerjaan").selectOption("Produksi");

  await expect(page.locator(".document-page")).toContainText("Budi Santoso");
  await expect(page.locator(".document-page")).toContainText("Produksi");
  await expect(page.locator(".document-page")).toContainText("sesuai kesepakatan kedua belah pihak");
});
