const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  // Standard mobile viewport
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });

  // Pipe console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  const filePath = 'file://' + path.resolve(__dirname, '../infinite-egg.html');
  console.log('Loading:', filePath);

  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const outputDir = path.resolve(__dirname, '../test_artifacts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Home Tab
  console.log('Capturing 01_home_tab.png...');
  await page.screenshot({ path: path.join(outputDir, '01_home_tab.png') });

  // Function to click button by title or inner text
  async function clickTabByTitle(titleText) {
    const clicked = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button, nav button'));
      for (const b of btns) {
        if ((b.getAttribute('title') && b.getAttribute('title').includes(t)) ||
            (b.innerText && b.innerText.includes(t))) {
          b.click();
          return true;
        }
      }
      return false;
    }, titleText);
    if (clicked) {
      await new Promise(r => setTimeout(r, 800));
    }
    return clicked;
  }

  // 2. Shop Tab
  console.log('Clicking Shop tab...');
  if (await clickTabByTitle('상점')) {
    console.log('Capturing 02_shop_tab.png...');
    await page.screenshot({ path: path.join(outputDir, '02_shop_tab.png') });
  }

  // 3. Skin Tab
  console.log('Clicking Skin tab...');
  if (await clickTabByTitle('스킨')) {
    console.log('Capturing 03_skin_tab.png...');
    await page.screenshot({ path: path.join(outputDir, '03_skin_tab.png') });

    // Click on Slot 3 (해적 달걀)
    console.log('Clicking Pirate Egg slot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pirateBtn = btns.find(b => b.getAttribute('title') && b.getAttribute('title').includes('해적'));
      if (pirateBtn) pirateBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    console.log('Capturing 03_skin_pirate_selected.png...');
    await page.screenshot({ path: path.join(outputDir, '03_skin_pirate_selected.png') });

    // Click Equip button
    console.log('Clicking Equip button...');
    await clickTabByTitle('장착하기');
    await new Promise(r => setTimeout(r, 800));
  }

  // 4. Mission Tab
  console.log('Clicking Mission tab...');
  if (await clickTabByTitle('미션')) {
    console.log('Capturing 04_mission_tab.png...');
    await page.screenshot({ path: path.join(outputDir, '04_mission_tab.png') });

    // Click '주간' subtab
    console.log('Clicking Weekly subtab...');
    await clickTabByTitle('주간');
    await page.screenshot({ path: path.join(outputDir, '04_mission_weekly.png') });
  }

  // 5. Back to Home Tab to see equipped pirate egg
  console.log('Returning to Home tab...');
  await clickTabByTitle('홈');
  await new Promise(r => setTimeout(r, 800));
  console.log('Capturing 05_home_pirate_equipped.png...');
  await page.screenshot({ path: path.join(outputDir, '05_home_pirate_equipped.png') });

  // 6. Start Game
  console.log('Starting game by clicking [출발하기!]...');
  const started = await clickTabByTitle('출발하기');
  if (started) {
    await new Promise(r => setTimeout(r, 1200));
    console.log('Capturing 06_gameplay_start.png...');
    await page.screenshot({ path: path.join(outputDir, '06_gameplay_start.png') });

    // Simulate jump & turn
    console.log('Playing: Space to jump...');
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 500));
    console.log('Playing: Z to turn...');
    await page.keyboard.press('KeyZ');
    await new Promise(r => setTimeout(r, 600));

    console.log('Capturing 07_gameplay_active.png...');
    await page.screenshot({ path: path.join(outputDir, '07_gameplay_active.png') });
  }

  console.log('All visual verification tests completed!');
  await browser.close();
})();
