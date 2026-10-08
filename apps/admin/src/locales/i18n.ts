import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esCommon from './es/common.json';
import enCommon from './en/common.json';

const savedLanguage = localStorage.getItem('preferred-language') || 'es';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: esCommon },
    en: { translation: enCommon },
  },
  lng: savedLanguage,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
