interface SiteConfig {
  name: string;
  url: string;
  tagline: string;
  subtitle: string;
  description: string;
  location: { city: string; region: string; country: string; label: string };
  shipping: string;
  cuanto: string;
  instagram: string;
  instagramHandle: string;
  instagramDM: string;
  /**
   * URL de WhatsApp (p. ej. `https://wa.me/…`). Si se define, aparece un botón en
   * "Cómo comprar" y un link en el footer. Ojo: el número quedaría en el HTML.
   */
  whatsapp?: string;
}

export const site: SiteConfig = {
  name: 'Obsidian Finds',
  url: 'https://obsidian-finds.com',
  tagline: 'Dark Style, Tropical Heat',
  subtitle: 'Moda alternativa para espíritus indomables',
  description:
    'Moda alternativa para espíritus indomables: ropa nueva, trajes de baño y accesorios de estilo dark. Desde David, Chiriquí, con envíos a todo Panamá.',
  location: { city: 'David', region: 'Chiriquí', country: 'PA', label: 'David, Chiriquí' },
  shipping: 'Envíos a todo Panamá',
  cuanto: 'https://cuanto.app/Ob.finds',
  instagram: 'https://www.instagram.com/obsidian.finds',
  instagramHandle: '@obsidian.finds',
  instagramDM: 'https://ig.me/m/obsidian.finds',
};
