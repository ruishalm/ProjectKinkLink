import React, { useState, useEffect, useRef } from 'react';
import styles from './TutorialModal.module.css';
import PlayingCard from './PlayingCard'; // Importa o PlayingCard

// --- NOVA ETAPA 1 ---
const TutorialStep1 = () => (
  <div className={styles.stepContainer}>
    <h2 className={styles.stepTitle}>Como se Conectar</h2>
    <p className={styles.stepSubtitle}>Para começar, um de vocês gera um código e o outro insere para vincular as contas.</p>
    <div className={styles.linkMockupContainer}>
      <div className={styles.linkMockupSection}>
        <h4>1. Um de vocês gera o código:</h4>
        <div className={styles.generatedCodeMockup}>
          <span>ABCDEF</span>
          <button className={`genericButton ${styles.copyButton}`}>Copiar</button>
        </div>
      </div>
      <div className={styles.linkArrow}>➔</div>
      <div className={styles.linkMockupSection}>
        <h4>2. O outro insere o código:</h4>
        <input type="text" className="klnkl-input" style={{textAlign: 'center'}} value="ABCDEF" readOnly />
        <button className="genericButton">Conectar</button>
      </div>
    </div>
  </div>
);
const TutorialStep2 = () => {
  const exampleCard = {
    id: 'tutorial-1',
    text: '★ faz uma massagem sensual em ▲, explorando as costas e o pescoço lentamente.',
    category: 'sensorial',
    intensity: 2,
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Como Jogar</h2>
      <div className={styles.interactiveArea}>
        <div className={`${styles.instruction} ${styles.leftInstruction}`}>
          <div className={styles.arrow}>&larr;</div>
          <p>Arraste para a <strong>esquerda</strong> se NÃO topa.</p>
        </div>
        <div className={styles.cardWrapper}><PlayingCard data={exampleCard} targetWidth={220} targetHeight={308} isFlipped={false} /></div>
        <div className={`${styles.instruction} ${styles.rightInstruction}`}><p>Arraste para a <strong>direita</strong> se você TOPA!</p><div className={styles.arrow}>&rarr;</div></div>
      </div>
      <div className={styles.bottomInstruction}><p>Deslizou errado? Use o botão <strong>Oops!</strong> para desfazer sua última rejeição.</p><button className={`${styles.oopsButton} genericButton`} disabled>Oops!</button></div>
    </div>
  );
};

// ==========================================================
// ETAPA 2 - (Esta parte foi corrigida)
const TutorialStep3 = () => {
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Entendendo os Links</h2>
      <p className={styles.stepSubtitle}>Quando você e seu par topam a mesma carta, ela vira um <strong>Link</strong> e aparece aqui!</p>

      <div className={styles.matchesScreenMockup}>
        {/* Seção Top Links */}
        <div className={styles.matchesSection}>
          {/* Removido 'style' e usado a nova classe 'topLinkCallout' */}
          <div className={styles.topLinkCallout}>Aqui ficam seus Top Links 🔥, os favoritos do casal.</div>
          <h3 className={styles.matchesSectionTitle}>🔥 Top Links</h3>
          <div className={styles.matchesCarousel}>
            <div className={styles.miniCard}>Massagem</div>
            <div className={styles.miniCard}>Jantar</div>
            <div className={styles.miniCard}>Viagem</div>
          </div>
        </div>

        {/* Seção de Categoria */}
        <div className={styles.matchesSection}>
          {/* Removido 'style' e usado a classe 'categoryCallout' */}
          <div className={styles.categoryCallout}>Seus outros Links são organizados por categoria.</div>
          <h3 className={styles.matchesSectionTitle}>Sensorial</h3>
          <div className={styles.matchesCarousel}>
            <div className={`${styles.miniCard} ${styles.hasNotification}`}>
              {/* Removido 'style' e usado a classe 'notificationCallout' */}
              <div className={styles.notificationCallout}>Este indicador mostra um novo Link ou uma nova mensagem!</div>
              Gelo no corpo
            </div>
            <div className={styles.miniCard}>Venda</div>
            <div className={styles.miniCard}>Mordidas</div>
          </div>
        </div>
      </div>
      <p className={styles.bottomText}>Clique em qualquer Link para conversar com seu par sobre ele.</p>
    </div>
  );
};
// ==========================================================
// FIM DAS CORREÇÕES
// ==========================================================
const TutorialStep4 = () => {
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Conversando sobre os Links</h2>
      <p className={styles.stepSubtitle}>Clique em um Link para abrir o chat. Cada carta tem sua própria conversa privada.</p>

      <div className={styles.chatModalMockup}>
        <div className={styles.chatCardHeader}>
          "Massagem sensual com óleos quentes..."
        </div>
        <div className={styles.chatMessagesArea}>
          <div className={`${styles.chatMessage} ${styles.received}`}>
            <div className={styles.chatBubble}>Acho que essa seria uma ótima forma de começar o fim de semana 😉</div>
          </div>
          <div className={`${styles.chatMessage} ${styles.sent}`}>
            <div className={styles.chatBubble}>Com certeza! Já estou até imaginando...</div>
          </div>
        </div>
        <div className={styles.chatInputMockup}>Digite sua mensagem...</div>
      </div>
      <p className={styles.bottomText}>Converse, planeje e divirta-se!</p>
    </div>
  );
};

const TutorialStep5 = () => (
  <div className={styles.stepContainer}>
    <h2 className={styles.stepTitle}>Gerenciando seu Perfil</h2>
    <p className={styles.stepSubtitle}>Na página de perfil, você pode editar suas informações e gerenciar seu vínculo.</p>
    <div className={styles.profileMockup}> {/* Corrigido: className */}
      <div className={styles.profileHeader}>
        <span className={styles.profileSymbol}>★</span>
        <span className={styles.profileName}>Seu Nome</span>
      </div>
      <div className={styles.profileSectionMockup}>
        <h4>Sobre Mim</h4>
        <p>Um pouco sobre seus gostos e o que você busca...</p>
      </div>
      <div className={styles.profileSectionMockup}>
        <h4>Vínculo</h4>
        <p>Você está vinculado com: <strong>Nome do Par (▲)</strong></p>
        <button className={`${styles.unlinkButtonMockup} genericButton`} disabled>Desvincular</button>
      </div>
      <div className={styles.profileSectionMockup}>
        <h4>‼️ Filtro de Intensidade ‼️</h4>
        <p>Ajuste para ver apenas cartas até o nível de intensidade desejado.</p>
        <div className={styles.intensitySelectorMockup}>
          <div className={`${styles.intensityLevelMockup} ${styles.active}`}></div>
          <div className={`${styles.intensityLevelMockup} ${styles.active}`}></div>
          <div className={`${styles.intensityLevelMockup} ${styles.active}`}></div>
          <div className={styles.intensityLevelMockup}></div>
          <div className={styles.intensityLevelMockup}></div>
        </div>
      </div>
    </div>
  </div>
);
const TutorialStep6 = () => <div className={styles.stepContainer}><h2 className={styles.stepTitle}>Tudo Pronto!</h2><p className={styles.stepSubtitle}>Explore, divirta-se e descubra novos Links com seu par. Bom jogo!</p></div>;


interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6; // Corrigido: total de etapas
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Reseta para o passo 1 quando o modal é fechado e reaberto
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1); // Corrigido: fechamento do if
    }
  }, [isOpen]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(); // Apenas fecha o modal na última etapa
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <TutorialStep1 />;
      case 2: return <TutorialStep2 />;
      case 3: return <TutorialStep3 />;
      case 4: return <TutorialStep4 />;
      case 5: return <TutorialStep5 />;
      case 6: return <TutorialStep6 />;
      default: return null;
    }
  };

  return (
    <div className={styles.modalOverlay}> {/* Corrigido: fechamento do return */}
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef}>
        <button onClick={onClose} className={styles.closeButton} aria-label="Fechar Tutorial">&times;</button>
        <div className={styles.stepIndicator}>Etapa {currentStep} de {totalSteps}</div>
        <div className={styles.stepContent}>{renderStepContent()}</div>
        <div className={styles.navigation}>
          {currentStep > 1 && <button onClick={handlePrev} className={`${styles.navButton} genericButton`}>Anterior</button>}
          <button onClick={handleNext} className={`${styles.navButton} ${styles.primaryNavButton} genericButton`}>
            {currentStep === totalSteps ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;