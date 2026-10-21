// Procesa los insumos de `_input/` y escribe los resultados versionados en el repo.
// Se corre una vez a mano: `npm run assets`. El build no depende de `_input/`.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { optimize } from 'svgo';

const ROOT = path.resolve(import.meta.dirname, '..');
const INPUT = path.join(ROOT, '_input');
const FOTOS_OUT = path.join(ROOT, 'src/assets/fotos');
const LOGO_OUT = path.join(ROOT, 'src/assets/logo');
const PUBLIC = path.join(ROOT, 'public');

const OBSIDIANA = '#0B0B0D';
const HUESO = '#F0EFEB';
const NEON = '#A4DF2E';
const MAX_SIDE = 1600;
const MAX_BYTES = 1024 * 1024;

// Recortes en fracción del lado correspondiente.
// - post-02 trae bandas negras de ~114 px arriba y abajo (captura); se quitan con margen.
// - post-06, 09 y 12 traen la marca ✦ de Gemini en la esquina inferior derecha; se recorta
//   la franja inferior que la contiene (sin retoque ni relleno).
const WATERMARK = { bottom: 0.075 };
const FOTOS = [
  { src: 'post-01', out: 'bikini-llamas' },
  { src: 'post-02', out: 'bikini-murcielagos-rojos', crop: { top: 120 / 960, bottom: 120 / 960 } },
  { src: 'post-03', out: 'set-malla-cerezas' },
  { src: 'post-04', out: 'bikini-negro-tiras-rojas' },
  { src: 'post-06', out: 'bikini-cruces-neon', crop: WATERMARK },
  { src: 'post-08', out: 'playa-lancha' },
  { src: 'post-09', out: 'bikini-calaveras-celeste', crop: WATERMARK },
  { src: 'post-10', out: 'playa-orilla' },
  { src: 'post-11', out: 'detalle-parca-neon' },
  { src: 'post-12', out: 'bikini-sinful-neon', crop: WATERMARK },
  { src: 'post-14', out: 'detalle-corazon-morado' },
  { src: 'post-15', out: 'bikini-morado-roca' },
];
// Descartadas por duplicadas: post-05 (= 06), post-07 (= 09, con marco), post-13 (= 12), post-16 (= 15).

function unzipAssets() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-assets-'));
  execFileSync('unzip', ['-q', '-o', path.join(INPUT, 'obsidian-finds-assets.zip'), '-d', dir]);
  const fotos = path.join(dir, 'obsidian-finds-assets', 'fotos');
  if (!fs.existsSync(fotos)) throw new Error(`No encontré fotos/ dentro del zip (${dir})`);
  return fotos;
}

async function processFotos(srcDir) {
  fs.mkdirSync(FOTOS_OUT, { recursive: true });
  for (const { src, out, crop = {} } of FOTOS) {
    const file = path.join(srcDir, `${src}.png`);
    const { width, height } = await sharp(file).metadata();
    const top = Math.round((crop.top ?? 0) * height);
    const bottom = Math.round((crop.bottom ?? 0) * height);
    const left = Math.round((crop.left ?? 0) * width);
    const right = Math.round((crop.right ?? 0) * width);
    const dest = path.join(FOTOS_OUT, `${out}.jpg`);
    const info = await sharp(file)
      .extract({ left, top, width: width - left - right, height: height - top - bottom })
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(dest);
    if (info.size > MAX_BYTES) throw new Error(`${out}.jpg pesa ${info.size} bytes (> 1 MB)`);
    console.log(`foto  ${src} → ${out}.jpg  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}

function optimizeSvg(name) {
  const raw = fs.readFileSync(path.join(INPUT, `${name}.svg`), 'utf8');
  const { data } = optimize(raw, {
    multipass: true,
    floatPrecision: 0, // viewBox de 1200–2060 unidades: error ≤ 0.5 u, invisible (comparado renderizando a 600 px)
    plugins: [
      'preset-default', // incluye removeMetadata (manifiesto C2PA) y removeUnusedNS
      { name: 'removeAttrs', params: { attrs: ['svg:(role|aria-label)'] } }, // la accesibilidad se decide donde se usa
    ],
  });
  if (!data.includes('currentColor')) throw new Error(`${name}: se perdió currentColor`);
  fs.mkdirSync(LOGO_OUT, { recursive: true });
  fs.writeFileSync(path.join(LOGO_OUT, `${name}.svg`), data);
  console.log(`svg   ${name}.svg  ${(raw.length / 1024).toFixed(0)} KB → ${(data.length / 1024).toFixed(0)} KB`);
  return data;
}

const viewBoxOf = (svg) => svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const innerOf = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Coloca un SVG (currentColor) dentro de una caja, centrado, pintado con `color`.
function placeSvg(svg, { x, y, w, h, color }) {
  const [, , vw, vh] = viewBoxOf(svg);
  const s = Math.min(w / vw, h / vh);
  const tx = x + (w - vw * s) / 2;
  const ty = y + (h - vh * s) / 2;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${innerOf(svg).replaceAll('currentColor', color)}</g>`;
}

async function makeFavicons(cristal) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" fill="${OBSIDIANA}"/>` +
    placeSvg(cristal, { x: 96, y: 40, w: 320, h: 432, color: HUESO }) +
    `</svg>`;
  fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), svg);
  const sizes = { 'favicon-32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 };
  for (const [file, size] of Object.entries(sizes)) {
    await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC, file));
  }
  console.log(`icon  favicon.svg + ${Object.keys(sizes).join(', ')}`);
}

async function makeOg(logo) {
  const W = 1200, H = 630, SPLIT_TOP = 700, SPLIT_BOTTOM = 560;
  const fotoW = W - SPLIT_BOTTOM;
  const foto = await sharp(path.join(FOTOS_OUT, 'bikini-sinful-neon.jpg'))
    .resize(fotoW, H, { fit: 'cover', position: 'attention' })
    .toBuffer();
  // Corte diagonal: la foto ocupa el trapecio derecho.
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fotoW}" height="${H}">` +
      `<polygon points="${SPLIT_TOP - SPLIT_BOTTOM},0 ${fotoW},0 ${fotoW},${H} 0,${H}" fill="#fff"/></svg>`,
  );
  const fotoRecortada = await sharp(foto).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      placeSvg(logo, { x: 40, y: 80, w: 500, h: 470, color: HUESO }) +
      `<line x1="${SPLIT_TOP}" y1="0" x2="${SPLIT_BOTTOM}" y2="${H}" stroke="${NEON}" stroke-width="10"/>` +
      `</svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: OBSIDIANA } })
    .composite([{ input: fotoRecortada, left: SPLIT_BOTTOM, top: 0 }, { input: overlay, left: 0, top: 0 }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'og.jpg'));
  console.log('og    og.jpg 1200×630');
}

// Grano sutil del fondo (evoca la arena volcánica). Es un PNG chico con ruido de 4 niveles de
// opacidad; un SVG con feTurbulence costaba cientos de ms de render en móvil.
async function makeGrain() {
  const S = 128;
  const levels = [0, 5, 10, 16];
  const px = Buffer.alloc(S * S * 2);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < S * S; i++) {
    px[i * 2] = 255;
    px[i * 2 + 1] = levels[Math.floor(rand() * levels.length)];
  }
  const info = await sharp(px, { raw: { width: S, height: S, channels: 2 } })
    .png({ palette: true, colours: 4, compressionLevel: 9 })
    .toFile(path.join(ROOT, 'src/assets/grano.png'));
  console.log(`grano grano.png ${(info.size / 1024).toFixed(1)} KB`);
}

const fotosDir = unzipAssets();
await makeGrain();
await processFotos(fotosDir);
const cristal = optimizeSvg('logo-cristal');
const logo = optimizeSvg('logo-obsidian-finds');
fs.mkdirSync(PUBLIC, { recursive: true });
await makeFavicons(cristal);
await makeOg(logo);
fs.rmSync(path.dirname(fotosDir), { recursive: true, force: true });
