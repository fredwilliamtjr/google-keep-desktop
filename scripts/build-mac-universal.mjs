#!/usr/bin/env node
// Gera um .app universal (x64 + arm64) para macOS e empacota num .zip.
//
// Por que não usar `electron-forge make --arch=universal` direto?
// O FusesPlugin altera o binário do Electron e cada arquitetura é assinada
// separadamente, então os arquivos `_CodeSignature/CodeResources` ficam com
// hashes diferentes entre x64 e arm64. O fusor (@electron/universal) exige que
// todo arquivo não-binário tenha SHA idêntico e aborta. A saída confiável, sem
// Developer ID, é: empacotar cada arch, remover as assinaturas (para os arquivos
// baterem), fundir os Mach-O com lipo e re-assinar ad-hoc o resultado uma vez só.
//
// Uso: node scripts/build-mac-universal.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { makeUniversalApp } from '@electron/universal';

const ROOT = path.resolve(import.meta.dirname, '..');
const APP_NAME = 'Google Keep Desktop';
const OUT = path.join(ROOT, 'out');

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });

// Caminho do .app dentro de uma pasta de empacotamento do Forge.
const appIn = (dir) => path.join(dir, `${APP_NAME}.app`);

// Remove todas as pastas _CodeSignature do bundle para os arquivos baterem
// entre as arquiteturas antes da fusão.
const stripSignatures = (appPath) =>
  run('bash', ['-c', `find "${appPath}" -name _CodeSignature -type d -prune -exec rm -rf {} +`]);

function packageArch(arch) {
  console.log(`\n▶ Empacotando ${arch}…`);
  run('npx', ['electron-forge', 'package', '--platform=darwin', `--arch=${arch}`]);
  const dir = path.join(OUT, `${APP_NAME}-darwin-${arch}`);
  const app = appIn(dir);
  if (!existsSync(app)) throw new Error(`Não encontrei o .app empacotado: ${app}`);
  stripSignatures(app);
  return app;
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });

  const x64App = packageArch('x64');
  const arm64App = packageArch('arm64');

  const tmp = mkdtempSync(path.join(tmpdir(), 'gkd-universal-'));
  const universalApp = path.join(tmp, `${APP_NAME}.app`);

  console.log('\n▶ Fundindo x64 + arm64 → universal (lipo)…');
  await makeUniversalApp({
    x64AppPath: x64App,
    arm64AppPath: arm64App,
    outAppPath: universalApp,
    force: true,
  });

  console.log('\n▶ Re-assinando ad-hoc o app universal…');
  run('codesign', ['--force', '--deep', '--sign', '-', universalApp]);

  const distDir = path.join(OUT, 'make', 'zip', 'darwin', 'universal');
  mkdirSync(distDir, { recursive: true });
  const zipPath = path.join(distDir, `${APP_NAME}.app.zip`);
  rmSync(zipPath, { force: true });

  console.log('\n▶ Compactando o .app universal…');
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', universalApp, zipPath]);

  console.log('\n▶ Verificando arquiteturas do binário final:');
  run('lipo', ['-archs', path.join(universalApp, 'Contents', 'MacOS', 'google-keep-desktop')]);

  rmSync(tmp, { recursive: true, force: true });
  console.log(`\n✅ Pronto: ${zipPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
