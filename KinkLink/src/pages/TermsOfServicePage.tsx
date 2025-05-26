// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\TermsOfServicePage.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
// Importa o conteúdo do arquivo Markdown como texto cru.
// Certifique-se que o caminho para o arquivo .md está correto.
// O '?raw' é uma funcionalidade do Vite para importar arquivos como string.
import termsContent from '../../legal/TERMOS_DE_SERVICO.md?raw';
import styles from './TermsOfServicePage.module.css'; // Importa os CSS Modules

const TermsOfServicePage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* 
          Para aplicar os estilos H1, H2, etc. do .module.css ao conteúdo do Markdown,
          envolvemos o ReactMarkdown em um div com uma classe específica.
          Os seletores no .module.css (ex: .markdownContent h1) farão o trabalho.
        */}
        <div className={styles.markdownContent}>
          <ReactMarkdown>{termsContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
