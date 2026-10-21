import type { ImageMetadata } from 'astro';
import sinful from '../assets/fotos/bikini-sinful-neon.jpg';
import calaveras from '../assets/fotos/bikini-calaveras-celeste.jpg';
import parca from '../assets/fotos/detalle-parca-neon.jpg';
import tirasRojas from '../assets/fotos/bikini-negro-tiras-rojas.jpg';
import cruces from '../assets/fotos/bikini-cruces-neon.jpg';
import murcielagos from '../assets/fotos/bikini-murcielagos-rojos.jpg';
import cerezas from '../assets/fotos/set-malla-cerezas.jpg';
import corazon from '../assets/fotos/detalle-corazon-morado.jpg';
import moradoRoca from '../assets/fotos/bikini-morado-roca.jpg';

export type StickerColor = 'neon' | 'morado' | 'rojo' | 'hueso';

export interface LookbookItem {
  src: ImageMetadata;
  alt: string;
  label: string;
  sticker: StickerColor;
  /** Ancho completo en la grilla de 2 columnas (móvil y tablet). */
  full?: boolean;
  /** Posición en la grilla de 12 columnas (escritorio): columna, ancho, fila, alto, en celdas cuadradas. */
  desktop: { col: number; cols: number; row: number; rows: number };
}

// "Sinful" es lo que dice la prenda; el resto de etiquetas describe lo que se ve.
export const lookbook: LookbookItem[] = [
  {
    src: sinful,
    alt: 'Bikini verde neón con cruces negras en el top y la palabra «sinful» y una parca estampadas en el bottom, sobre arena volcánica negra con stickers góticos',
    label: 'Sinful',
    sticker: 'hueso',
    full: true,
    desktop: { col: 1, cols: 6, row: 1, rows: 8 },
  },
  {
    src: calaveras,
    alt: 'Bikini bandeau con estampado de calaveras y rosas en celeste y negro, junto a piedras, lentes y stickers sobre arena negra',
    label: 'Calaveras',
    sticker: 'neon',
    desktop: { col: 7, cols: 4, row: 1, rows: 5 },
  },
  {
    src: parca,
    alt: 'Detalle de un bottom verde neón con una parca y una cruz estampadas en negro',
    label: 'Parca neón',
    sticker: 'morado',
    desktop: { col: 11, cols: 2, row: 2, rows: 3 },
  },
  {
    src: tirasRojas,
    alt: 'Bikini negro acanalado con tiras rojas para amarrar, sobre arena negra con piedras y un trozo de madera',
    label: 'Tiras rojas',
    sticker: 'rojo',
    full: true,
    desktop: { col: 7, cols: 3, row: 6, rows: 3 },
  },
  {
    src: cruces,
    alt: 'Bikini negro con ribete verde neón, cruces invertidas blancas y una parca estampada, sobre arena negra',
    label: 'Cruces',
    sticker: 'neon',
    desktop: { col: 10, cols: 3, row: 5, rows: 4 },
  },
  {
    src: murcielagos,
    alt: 'Bikini negro con estampado de murciélagos rojos, rodeado de stickers de murciélagos, lentes negros y madera sobre arena negra',
    label: 'Murciélagos',
    sticker: 'rojo',
    desktop: { col: 1, cols: 3, row: 9, rows: 4 },
  },
  {
    src: cerezas,
    alt: 'Top de malla negra con cerezas y lazo rojos y bottom negro con tiras rojas, sobre arena de playa',
    label: 'Cerezas',
    sticker: 'hueso',
    desktop: { col: 4, cols: 3, row: 9, rows: 5 },
  },
  {
    src: corazon,
    alt: 'Detalle de un bikini morado con un aro rosado en forma de corazón, sobre una roca',
    label: 'Corazón',
    sticker: 'morado',
    desktop: { col: 7, cols: 3, row: 10, rows: 4 },
  },
  {
    src: moradoRoca,
    alt: 'Bikini morado sobre una roca volcánica frente al mar, con una isla al fondo',
    label: 'Morado',
    sticker: 'neon',
    full: true,
    desktop: { col: 10, cols: 3, row: 9, rows: 4 },
  },
];
