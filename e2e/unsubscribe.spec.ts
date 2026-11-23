import { mailingMessages } from "@softure-ai/mailing";
import { getRecipientKey, signRecipientKey } from "@softure-ai/mailing/server";
import { expect, test } from "@softure-ai/testing/playwright";
import { E2E_UNSUBSCRIBE_SECRET } from "./fixtures.ts";

const copy = mailingMessages.en.unsubscribe;

function getLinkQuery(address: string): string {
  const recipientKey = getRecipientKey(address);
  return new URLSearchParams({ r: recipientKey, t: signRecipientKey(recipientKey, E2E_UNSUBSCRIBE_SECRET) }).toString();
}

test("a digest recipient unsubscribes on the page without signing in", async ({ page }) => {
  await page.goto(`/unsubscribe?${getLinkQuery("reader@example.com")}`);
  await expect(page).toHaveURL(/\/unsubscribe/);
  await expect(page.getByRole("heading", { name: copy.title })).toBeVisible();
  await page.getByRole("button", { name: copy.submit }).click();
  await expect(page.getByText(copy.doneTitle)).toBeVisible();
});

test("a mail client's one-click unsubscribe is accepted without a session, and a forged link is refused", async ({ request }) => {
  const accepted = await request.post(`/api/mailing/unsubscribe?${getLinkQuery("client@example.com")}`, {
    form: { "List-Unsubscribe": "One-Click" },
    maxRedirects: 0,
  });
  expect(accepted.status()).toBe(200);

  const forged = await request.post(`/api/mailing/unsubscribe?r=${getRecipientKey("client@example.com")}&t=forged`, {
    form: { "List-Unsubscribe": "One-Click" },
    maxRedirects: 0,
  });
  expect(forged.status()).toBe(400);
});
