// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\TermsOfServicePage.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './TermsOfServicePage.module.css'; // Importa os CSS Modules

const TermsOfServicePage: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privacyMarkdownContent, setPrivacyMarkdownContent] = useState('');
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      setPrivacyError(null);

      try {
        // Busca o arquivo de Termos de Serviço
        const response = await fetch('/TERMOS_DE_SERVICO.md');
        if (!response.ok) {
          throw new Error(`Falha ao carregar termos: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        setMarkdownContent(text);

        // Busca o arquivo de Política de Privacidade
        const privacyResponse = await fetch('/PoliticaDePrivacidade.md');
         if (!privacyResponse.ok) {
          throw new Error(`Falha ao carregar política de privacidade: ${privacyResponse.status} ${privacyResponse.statusText}`);
        }
        const privacyText = await privacyResponse.text();
        setPrivacyMarkdownContent(privacyText);

      } catch (err) {
        let errorMessage = "Não foi possível carregar os documentos legais. Por favor, tente novamente mais tarde.";
        if (err instanceof Error) {
            errorMessage = `Erro ao buscar documentos legais: ${err.message}`;
        }
        console.error("Erro ao buscar documentos legais:", err);
        setError(errorMessage);
      } finally { // Este finally só roda após AMBOS os fetches
        setIsLoading(false);
      }
    };

    fetchDocuments(); // Corrigido o nome da função chamada
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez ao montar o componente

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContentWrapper}> {/* Renomeado para evitar conflito se mainContent for usado no Header */}
        <div className={styles.contentWrapper}>
          <div className={styles.markdownContent}> {/* Mantém a classe para estilos */}
            {(isLoading) && <p>Carregando documentos legais...</p>}
            {(error || privacyError) && (
              <>
                <p style={{ color: 'red' }}>{error}</p>
                <p style={{ color: 'red' }}>{privacyError}</p>
              </>
            )}
            {/* Concatena os conteúdos se não houver erro e não estiver carregando */}
            {!isLoading && !error && !privacyError && <ReactMarkdown>{markdownContent + "\n\n---\n\n" + privacyMarkdownContent}</ReactMarkdown>}
            {!isLoading && !error && <ReactMarkdown>{markdownContent}</ReactMarkdown>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
