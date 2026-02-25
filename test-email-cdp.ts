/**
 * Gmail email test via CDPDriver — VISIBLE mode
 * Run: npx tsx test-email-cdp.ts
 */
import { CDPDriver } from './src/cdp-driver';

const TYPE_DELAY = 80;   // ms per keystroke — visible typing
const STEP_DELAY = 1500; // ms between steps

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const cdp = new CDPDriver();
  
  console.log('🔌 Connecting to Edge via CDP...');
  const connected = await cdp.connect();
  if (!connected) {
    console.error('❌ Could not connect. Is Edge running with --remote-debugging-port=9222?');
    process.exit(1);
  }
  console.log('✅ Connected to Edge');

  const page = (cdp as any).activePage;
  if (!page) { console.error('❌ No page'); process.exit(1); }

  // Bring Edge to front
  console.log('🪟 Bringing Edge to foreground...');
  await page.bringToFront();
  await sleep(1000);

  // Navigate to inbox
  console.log('📥 Going to inbox...');
  await page.goto('https://mail.google.com/mail/u/0/#inbox');
  await sleep(4000);

  // Click Compose
  console.log('📝 Clicking Compose...');
  await cdp.clickByText('Compose');
  await sleep(STEP_DELAY);

  // Fill To field
  console.log('📧 Typing To: amr_dabbas@hotmail.com');
  try {
    await page.click('[aria-label="To recipients"]', { timeout: 3000 });
  } catch {
    await page.click('input[type="text"][aria-label="To"]', { timeout: 3000 });
  }
  await sleep(500);
  await page.keyboard.type('amr_dabbas@hotmail.com', { delay: TYPE_DELAY });
  console.log('   ✅ To filled');
  await sleep(STEP_DELAY);

  // Tab to confirm recipient chip
  await page.keyboard.press('Tab');
  await sleep(STEP_DELAY);

  // Fill Subject
  console.log('📋 Typing Subject: Testing CDP Driver');
  try {
    await page.click('[aria-label="Subject"]', { timeout: 3000 });
  } catch {
    await page.click('input[name="subjectbox"]', { timeout: 3000 });
  }
  await sleep(500);
  await page.keyboard.type('Testing CDP Driver', { delay: TYPE_DELAY });
  console.log('   ✅ Subject filled');
  await sleep(STEP_DELAY);

  // Fill Body — Gmail body is contenteditable div
  console.log('💬 Typing Body: This email was composed and sent by Clawd Cursor using the CDP driver. No screenshots, no guessing — pure DOM interaction.');
  try {
    await page.click('div[role="textbox"][contenteditable="true"]', { timeout: 3000 });
  } catch {
    await page.click('div[aria-label="Message Body"]', { timeout: 3000 });
  }
  await sleep(500);
  await page.keyboard.type(
    'This email was composed and sent by Clawd Cursor using the CDP driver.\n\nNo screenshots, no coordinate guessing — pure DOM interaction. 🐾',
    { delay: TYPE_DELAY }
  );
  console.log('   ✅ Body filled');
  await sleep(2000);

  // Click Send
  console.log('📤 Clicking Send...');
  try {
    await page.locator('[aria-label*="Send "]').first().click({ timeout: 5000 });
  } catch {
    try {
      await page.click('div[role="button"]:has-text("Send")', { timeout: 3000 });
    } catch {
      await cdp.clickByText('Send');
    }
  }
  console.log('   ✅ Sent!');

  console.log('\n✅ Done! Check amr_dabbas@hotmail.com for the email.');
  await sleep(3000);
  await cdp.disconnect();
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
