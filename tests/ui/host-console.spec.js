import { expect, test } from "@playwright/test";

test("renders host console defaults", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Melody Co-Host Console/);
  await expect(page.getByText("Offline")).toBeVisible();
  await expect(page.getByText("Observing")).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Stop" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Activate Melody" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Pause Melody" })).toBeDisabled();
  await expect(page.locator("#agendaStatus")).toHaveText("No agenda provided");
  await expect(page.locator("#captureAgendaButton")).toBeDisabled();
});

test("updates auto-converse status on toggle", async ({ page }) => {
  await page.goto("/");

  const toggle = page.locator("#autoConverseToggle");
  const status = page.locator("#autoConverseStatus");

  await expect(toggle).toBeChecked();
  await expect(status).toContainText("Auto converse is enabled");

  await toggle.uncheck();
  await expect(status).toContainText("Auto converse is disabled");
  await expect(status).toHaveClass(/is-off/);

  await toggle.check();
  await expect(status).toContainText("Auto converse is enabled");
});

test("saves and clears document agenda", async ({ page }) => {
  await page.goto("/");

  const agendaInput = page.locator("#agendaInput");
  const saveButton = page.locator("#saveAgendaButton");
  const clearButton = page.locator("#clearAgendaButton");
  const agendaStatus = page.locator("#agendaStatus");

  await agendaInput.fill("Intro, risks, decisions");
  await saveButton.click();

  await expect(agendaStatus).toContainText("Document agenda saved");
  await expect(clearButton).toBeEnabled();

  await clearButton.click();
  await expect(agendaStatus).toHaveText("No agenda provided");
  await expect(clearButton).toBeDisabled();
});
