import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend) // Carrega traduções via http (da pasta public/locales)
  .use(LanguageDetector) // Detecta o idioma do navegador
  .use(initReactI18next) // Passa a instância para o react-i18next
  .init({
    fallbackLng: 'pt', // Idioma padrão caso não detecte ou falhe
    debug: true, // Ajuda a ver erros no console durante o dev

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Estrutura: /locales/pt/translation.json
    },

    ns: ['translation', 'cards', 'admin'], // Nossos namespaces, adicionado 'admin'
    defaultNS: 'translation',
  });

export default i18n;