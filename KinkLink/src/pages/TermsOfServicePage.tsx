// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\TermsOfServicePage.tsx
import React, { type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
// Importa o conteúdo do arquivo Markdown como texto cru.
// Certifique-se que o caminho para o arquivo .md está correto.
// O '?raw' é uma funcionalidade do Vite para importar arquivos como string.
import termsContent from '../../legal/TERMOS_DE_SERVICO.md?raw';

const pageContainerStyle: CSSProperties = {
  maxWidth: '800px',
  margin: '20px auto', // Ajustado para menos margem no topo
  padding: '25px',     // Um pouco mais de padding interno
  backgroundColor: '#2c2c2c', // Mesmo fundo das páginas de login/signup
  color: '#e0e0e0',
  borderRadius: '8px',
  fontFamily: '"Trebuchet MS", sans-serif',
  lineHeight: '1.7', // Melhor para leitura de texto longo
};

// Estilo para o container do conteúdo Markdown, se precisar de ajustes finos no futuro.
const markdownContainerStyle: CSSProperties = {
  // Por enquanto, deixaremos vazio. ReactMarkdown aplicará estilos básicos.
};

const TermsOfServicePage: React.FC = () => {
  return (
    <div style={pageContainerStyle}>
      <div style={markdownContainerStyle}>
        <ReactMarkdown>
          {termsContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
