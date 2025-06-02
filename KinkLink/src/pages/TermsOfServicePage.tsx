// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\TermsOfServicePage.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './TermsOfServicePage.module.css'; // Importa os CSS Modules

const TermsOfServicePage: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Busca o arquivo da pasta 'public'
        const response = await fetch('/TERMOS_DE_SERVICO.md');
        if (!response.ok) {
          throw new Error(`Falha ao carregar termos: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (err) {
        let errorMessage = "Não foi possível carregar os Termos de Serviço. Por favor, tente novamente mais tarde.";
        if (err instanceof Error) {
            errorMessage = `Erro ao buscar Termos de Serviço: ${err.message}`;
        }
        console.error("Erro ao buscar Termos de Serviço:", err);
        setError(errorMessage);
        setMarkdownContent("Conteúdo dos Termos de Serviço não pôde ser carregado."); // Conteúdo de fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez ao montar o componente

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContentWrapper}> {/* Renomeado para evitar conflito se mainContent for usado no Header */}
        <div className={styles.contentWrapper}>
          <div className={styles.markdownContent}>
            {isLoading && <p>Carregando Termos de Serviço...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!isLoading && !error && <ReactMarkdown>{markdownContent}</ReactMarkdown>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
