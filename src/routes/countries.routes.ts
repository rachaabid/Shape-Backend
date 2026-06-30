import { Router } from 'express';
import axios from 'axios';

const FALLBACK_COUNTRIES = [
  { cca2: 'DZ', flags: { svg: 'https://flagcdn.com/dz.svg' }, name: { common: 'Algeria' }, translations: { fra: { common: 'Algérie' }, ara: { common: 'الجزائر' } } },
  { cca2: 'FR', flags: { svg: 'https://flagcdn.com/fr.svg' }, name: { common: 'France' }, translations: { fra: { common: 'France' }, ara: { common: 'فرنسا' } } },
  { cca2: 'MA', flags: { svg: 'https://flagcdn.com/ma.svg' }, name: { common: 'Morocco' }, translations: { fra: { common: 'Maroc' }, ara: { common: 'المغرب' } } },
  { cca2: 'TN', flags: { svg: 'https://flagcdn.com/tn.svg' }, name: { common: 'Tunisia' }, translations: { fra: { common: 'Tunisie' }, ara: { common: 'تونس' } } },
  { cca2: 'EG', flags: { svg: 'https://flagcdn.com/eg.svg' }, name: { common: 'Egypt' }, translations: { fra: { common: 'Égypte' }, ara: { common: 'مصر' } } },
  { cca2: 'DE', flags: { svg: 'https://flagcdn.com/de.svg' }, name: { common: 'Germany' }, translations: { fra: { common: 'Allemagne' }, ara: { common: 'ألمانيا' } } },
  { cca2: 'GB', flags: { svg: 'https://flagcdn.com/gb.svg' }, name: { common: 'United Kingdom' }, translations: { fra: { common: 'Royaume-Uni' }, ara: { common: 'المملكة المتحدة' } } },
  { cca2: 'US', flags: { svg: 'https://flagcdn.com/us.svg' }, name: { common: 'United States' }, translations: { fra: { common: 'États-Unis' }, ara: { common: 'الولايات المتحدة' } } },
  { cca2: 'CA', flags: { svg: 'https://flagcdn.com/ca.svg' }, name: { common: 'Canada' }, translations: { fra: { common: 'Canada' }, ara: { common: 'كندا' } } },
  { cca2: 'BE', flags: { svg: 'https://flagcdn.com/be.svg' }, name: { common: 'Belgium' }, translations: { fra: { common: 'Belgique' }, ara: { common: 'بلجيكا' } } },
  { cca2: 'CH', flags: { svg: 'https://flagcdn.com/ch.svg' }, name: { common: 'Switzerland' }, translations: { fra: { common: 'Suisse' }, ara: { common: 'سويسرا' } } },
  { cca2: 'ES', flags: { svg: 'https://flagcdn.com/es.svg' }, name: { common: 'Spain' }, translations: { fra: { common: 'Espagne' }, ara: { common: 'إسبانيا' } } },
  { cca2: 'IT', flags: { svg: 'https://flagcdn.com/it.svg' }, name: { common: 'Italy' }, translations: { fra: { common: 'Italie' }, ara: { common: 'إيطاليا' } } },
  { cca2: 'LY', flags: { svg: 'https://flagcdn.com/ly.svg' }, name: { common: 'Libya' }, translations: { fra: { common: 'Libye' }, ara: { common: 'ليبيا' } } },
  { cca2: 'SA', flags: { svg: 'https://flagcdn.com/sa.svg' }, name: { common: 'Saudi Arabia' }, translations: { fra: { common: 'Arabie Saoudite' }, ara: { common: 'المملكة العربية السعودية' } } },
  { cca2: 'TR', flags: { svg: 'https://flagcdn.com/tr.svg' }, name: { common: 'Turkey' }, translations: { fra: { common: 'Turquie' }, ara: { common: 'تركيا' } } },
  { cca2: 'NL', flags: { svg: 'https://flagcdn.com/nl.svg' }, name: { common: 'Netherlands' }, translations: { fra: { common: 'Pays-Bas' }, ara: { common: 'هولندا' } } },
  { cca2: 'PT', flags: { svg: 'https://flagcdn.com/pt.svg' }, name: { common: 'Portugal' }, translations: { fra: { common: 'Portugal' }, ara: { common: 'البرتغال' } } },
  { cca2: 'JP', flags: { svg: 'https://flagcdn.com/jp.svg' }, name: { common: 'Japan' }, translations: { fra: { common: 'Japon' }, ara: { common: 'اليابان' } } },
  { cca2: 'CN', flags: { svg: 'https://flagcdn.com/cn.svg' }, name: { common: 'China' }, translations: { fra: { common: 'Chine' }, ara: { common: 'الصين' } } },
];

const router = Router();

router.get('/Countries', async (_req, res) => {
  try {
    const { data } = await axios.get(
      'https://restcountries.com/v3.1/all?fields=name,cca2,flags,translations',
      { timeout: 8000 },
    );
    if (Array.isArray(data)) {
      res.json(data);
    } else {
      // l'API a renvoyé autre chose (objet d'erreur, HTML…) → fallback
      res.json(FALLBACK_COUNTRIES);
    }
  } catch {
    res.json(FALLBACK_COUNTRIES);
  }
});

export default router;
