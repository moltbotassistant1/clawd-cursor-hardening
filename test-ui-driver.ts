/**
 * UIDriver test — Notepad + Calculator via Windows UI Automation
 * Run: npx tsx test-ui-driver.ts
 */
import { UIDriver } from './src/ui-driver';
import { exec } from 'child_process';

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function launch(cmd: string): Promise<void> {
  return new Promise((resolve) => {
    exec(cmd);
    setTimeout(resolve, 2500);
  });
}

async function main() {
  const driver = new UIDriver();

  // ── Test 1: Open Notepad & Type ──
  console.log('\n═══ TEST 1: Open Notepad & Type ═══\n');
  
  console.log('🚀 Launching Notepad...');
  await launch('start notepad.exe');
  await sleep(2000);

  // Find Notepad's editor — search globally (no default process yet)
  console.log('🔍 Finding Notepad text editor...');
  const editor = await driver.findElement({ name: 'Text editor', controlType: 'Document' });
  if (!editor) {
    console.log('   ❌ Could not find Notepad editor');
    return;
  }
  const notepadPid = editor.processId;
  console.log(`   ✅ Found: pid=${notepadPid}, type=${editor.controlType}`);

  // Type using ValuePattern (scoped to Notepad)
  console.log('\n⌨️  Typing into Notepad...');
  const typeResult = await driver.typeInElement('Text editor', 
    'Hello from Clawd Cursor UIDriver!\r\n\r\nThis was typed using Windows UI Automation.\r\nNo screenshots. No LLM calls. Zero tokens.',
    { controlType: 'Document', processId: notepadPid }
  );
  console.log('   Result:', typeResult.success ? '✅ Text set' : `❌ ${typeResult.error}`);
  await sleep(1500);

  // ── Test 2: Menu navigation using clickMenuPath ──
  console.log('\n═══ TEST 2: Menu Navigation ═══\n');

  // Use Edit > Select All via clickMenuPath (single script call, no timing issues)
  console.log('📂 Clicking Edit → Select All...');
  const menuResult = await driver.clickMenuPath(['Edit', 'Select All']);
  console.log('   Result:', JSON.stringify(menuResult));
  await sleep(1000);

  // ── Test 3: Element Bounds ──
  console.log('\n═══ TEST 3: Element Bounds ═══\n');
  
  for (const name of ['Text editor', 'File', 'Edit', 'View']) {
    const bounds = await driver.getElementBounds(name);
    if (bounds) {
      console.log(`   "${name}": ${bounds.width}x${bounds.height} at (${bounds.x},${bounds.y}) center=(${bounds.centerX},${bounds.centerY})`);
    }
  }

  // ── Test 4: Calculator — separate process ──
  console.log('\n═══ TEST 4: Calculator ═══\n');
  
  console.log('🧮 Launching Calculator...');
  await launch('start calc.exe');
  await sleep(3000);

  // Find Calculator's process — DON'T use defaultProcess (that's Notepad)
  console.log('🔍 Finding Calculator...');
  const calcWindow = await driver.findElement({ name: 'Calculator', controlType: 'Window' });
  if (!calcWindow) {
    console.log('   ❌ Calculator window not found');
  } else {
    const calcPid = calcWindow.processId;
    console.log(`   ✅ Found Calculator: pid=${calcPid}`);

    // Find number buttons scoped to Calculator's process
    console.log('🔍 Finding Calculator buttons...');
    const allButtons = await driver.findElements({ controlType: 'Button', processId: calcPid, maxResults: 40 });
    const numNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Zero', 'Plus', 'Minus', 'Equals', 'Multiply', 'Divide'];
    const calcButtons = allButtons.filter(b => numNames.includes(b.name));
    console.log(`   Found ${calcButtons.length} calculator buttons:`);
    calcButtons.forEach(b => console.log(`     - "${b.name}" (${b.automationId})`));

    // Calculate 42 + 58 = 100
    console.log('\n🔢 Calculating 42 + 58 = ...');
    
    for (const [btnName, label] of [['Four', '4'], ['Two', '2'], ['Plus', '+'], ['Five', '5'], ['Eight', '8'], ['Equals', '=']]) {
      const r = await driver.clickElement(btnName, { processId: calcPid });
      process.stdout.write(`   ${label} ${r.success ? '✅' : '❌'}  `);
      await sleep(400);
    }
    console.log('');
    await sleep(1000);

    // Read result — try AutomationId "CalculatorResults"
    console.log('\n📖 Reading result...');
    const resultEl = await driver.findElement({ automationId: 'CalculatorResults', processId: calcPid });
    if (resultEl) {
      console.log(`   Display name: "${resultEl.name}"`);
      const val = await driver.getElementValue('CalculatorResults');
      console.log(`   Value: ${val?.value || resultEl.name}`);
    } else {
      // Try reading by name pattern
      const display = await driver.findElement({ controlType: 'Text', processId: calcPid });
      console.log(`   Display: "${display?.name || 'not found'}"`);
    }
  }

  // ── Test 5: Wait for element ──
  console.log('\n═══ TEST 5: Wait for Element ═══\n');
  
  console.log('⏳ Waiting for "Text editor" (should be instant)...');
  const found = await driver.waitForElement('Text editor', 3000);
  console.log(`   ${found ? '✅ Found' : '❌ Not found'}`);

  console.log('⏳ Waiting for "Nonexistent Thing" (should timeout)...');
  const notFound = await driver.waitForElement('Nonexistent Thing', 3000);
  console.log(`   ${notFound ? '❌ Found??' : '✅ Correctly timed out'}`);

  // ── Done ──
  console.log('\n═══ ALL TESTS COMPLETE ═══\n');
  console.log('✅ Check Notepad (text should be selected) and Calculator (should show 100)');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
