// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Carrega traduções via http (ex: de /public/locales)
  .use(LanguageDetector) // Detecta o idioma do usuário
  .use(initReactI18next) // Passa a instância do i18n para o react-i18next
  .init({
    supportedLngs: ['pt', 'en', 'es'], // Idiomas que você planeja suportar (ex: Português, Inglês, Espanhol)
    fallbackLng: 'pt', // Idioma padrão se a detecção falhar ou o idioma não for suportado
    
    // Define os namespaces que você usará
    // 'translation' será o padrão para a UI
    // 'cards' será para os textos das cartas
    ns: ['translation', 'cards'],
    defaultNS: 'translation',

    debug: import.meta.env.DEV, // Ativa logs de debug em ambiente de desenvolvimento

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'], // Ordem de detecção de idioma
      caches: ['localStorage'], // Onde guardar o idioma detectado/selecionado
      lookupLocalStorage: 'kinklink_language_ui', // Chave no localStorage
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Caminho para os arquivos de tradução
    },
    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },
  });

export default i18n;