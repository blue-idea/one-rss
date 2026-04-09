import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const ARTIFACTS_DIR = resolve(ROOT, 'artifacts');
const DESIGN_IMAGE = resolve(ROOT, 'ui/发现/screen.png');
const ACTUAL_IMAGE = resolve(ARTIFACTS_DIR, 'explore-actual.png');
const DIFF_IMAGE = resolve(ARTIFACTS_DIR, 'explore-diff.png');
const EXPO_PORT = 4173;
const APP_URL = `http://127.0.0.1:${EXPO_PORT}/explore`;

const waitForUrlReady = async (url, timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Keep polling until timeout.
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 1500));
  }
  throw new Error(`等待应用启动超时: ${url}`);
};

const parsePng = async path => PNG.sync.read(await readFile(path));

const stopProcess = child => {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/f', '/t']);
    return;
  }
  child.kill('SIGTERM');
};

const run = async () => {
  await mkdir(ARTIFACTS_DIR, { recursive: true });

  const expo = spawn(`npm run web -- --port ${EXPO_PORT} --non-interactive`, {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true,
    detached: false,
  });

  try {
    await waitForUrlReady(APP_URL);
    const designPng = await parsePng(DESIGN_IMAGE);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: designPng.width, height: designPng.height },
      deviceScaleFactor: 1,
    });

    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ACTUAL_IMAGE, fullPage: false });
    await browser.close();

    const actualPng = await parsePng(ACTUAL_IMAGE);
    const diff = new PNG({ width: designPng.width, height: designPng.height });
    const mismatchPixels = pixelmatch(
      designPng.data,
      actualPng.data,
      diff.data,
      designPng.width,
      designPng.height,
      { threshold: 0.15 }
    );
    const total = designPng.width * designPng.height;
    const mismatchRate = ((mismatchPixels / total) * 100).toFixed(2);

    await writeFile(DIFF_IMAGE, PNG.sync.write(diff));
    console.log(`视觉回归完成: mismatch=${mismatchPixels}/${total} (${mismatchRate}%)`);
    console.log(`design: ${DESIGN_IMAGE}`);
    console.log(`actual: ${ACTUAL_IMAGE}`);
    console.log(`diff:   ${DIFF_IMAGE}`);
  } finally {
    stopProcess(expo);
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
