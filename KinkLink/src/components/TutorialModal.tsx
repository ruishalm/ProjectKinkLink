import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TutorialModal.module.css';
import PlayingCard from './PlayingCard'; // Importa o PlayingCard

// --- NOVA ETAPA 1 ---
const TutorialStep1 = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step1_title')}</h2>
      <p className={styles.stepSubtitle}>{t('tutorial_step1_subtitle')}</p>
      <div className={styles.linkMockupContainer}>
        <div className={styles.linkMockupSection}>
          <h4>{t('tutorial_step1_generate_label')}</h4>
          <div className={styles.generatedCodeMockup}>
            <span>ABCDEF</span>
            <button className={`genericButton ${styles.copyButton}`}>{t('tutorial_step1_copy_button')}</button>
          </div>
        </div>
        <div className={styles.linkArrow}>➔</div>
        <div className={styles.linkMockupSection}>
          <h4>{t('tutorial_step1_enter_label')}</h4>
          <input type="text" className="klnkl-input" style={{textAlign: 'center'}} value="ABCDEF" readOnly />
          <button className="genericButton">{t('tutorial_step1_connect_button')}</button>
        </div>
      </div>
    </div>
  );
};

const TutorialStep2 = () => {
  const { t } = useTranslation();
  const exampleCard = {
    id: 'tutorial-1',
    text: t('tutorial_step2_card_text'),
    category: 'sensorial',
    intensity: 2,
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step2_title')}</h2>
      <div className={styles.interactiveArea}>
        <div className={`${styles.instruction} ${styles.leftInstruction}`}>
          <div className={styles.arrow}>&larr;</div>
          <p dangerouslySetInnerHTML={{ __html: t('tutorial_step2_left_instruction') }} />
        </div>
        <div className={styles.cardWrapper}><PlayingCard data={exampleCard} targetWidth={220} targetHeight={308} isFlipped={false} /></div>
        <div className={`${styles.instruction} ${styles.rightInstruction}`}><p dangerouslySetInnerHTML={{ __html: t('tutorial_step2_right_instruction') }} /><div className={styles.arrow}>&rarr;</div></div>
      </div>
      <div className={styles.bottomInstruction}><p dangerouslySetInnerHTML={{ __html: t('tutorial_step2_oops_instruction') }} /><button className={`${styles.oopsButton} genericButton`} disabled>{t('card_pile_oops_button')}</button></div>
    </div>
  );
};

// ==========================================================
// ETAPA 2 - (Esta parte foi corrigida)
const TutorialStep3 = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step3_title')}</h2>
      <p className={styles.stepSubtitle} dangerouslySetInnerHTML={{ __html: t('tutorial_step3_subtitle') }} />

      <div className={styles.matchesScreenMockup}>
        {/* Seção Top Links */}
        <div className={styles.matchesSection}>
          {/* Removido 'style' e usado a nova classe 'topLinkCallout' */}
          <div className={styles.topLinkCallout}>{t('tutorial_step3_top_links_callout')}</div>
          <h3 className={styles.matchesSectionTitle}>{t('matches_top_links_title')}</h3>
          <div className={styles.matchesCarousel}>
            <div className={styles.miniCard}>{t('tutorial_mock_massage')}</div>
            <div className={styles.miniCard}>{t('tutorial_mock_dinner')}</div>
            <div className={styles.miniCard}>{t('tutorial_mock_trip')}</div>
          </div>
        </div>

        {/* Seção de Categoria */}
        <div className={styles.matchesSection}>
          {/* Removido 'style' e usado a classe 'categoryCallout' */}
          <div className={styles.categoryCallout}>{t('tutorial_step3_category_callout')}</div>
          <h3 className={styles.matchesSectionTitle}>{t('category_sensorial')}</h3>
          <div className={styles.matchesCarousel}>
            <div className={`${styles.miniCard} ${styles.hasNotification}`}>
              {/* Removido 'style' e usado a classe 'notificationCallout' */}
              <div className={styles.notificationCallout}>{t('tutorial_step3_notification_callout')}</div>
              {t('tutorial_mock_ice')}
            </div>
            <div className={styles.miniCard}>{t('tutorial_mock_blindfold')}</div>
            <div className={styles.miniCard}>{t('tutorial_mock_bites')}</div>
          </div>
        </div>
      </div>
      <p className={styles.bottomText}>{t('tutorial_step3_bottom_text')}</p>
    </div>
  );
};
// ==========================================================
// FIM DAS CORREÇÕES
// ==========================================================
const TutorialStep4 = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step4_title')}</h2>
      <p className={styles.stepSubtitle}>{t('tutorial_step4_subtitle')}</p>

      <div className={styles.chatModalMockup}>
        <div className={styles.chatCardHeader}>
          {t('tutorial_step4_chat_header')}
        </div>
        <div className={styles.chatMessagesArea}>
          <div className={`${styles.chatMessage} ${styles.received}`}>
            <div className={styles.chatBubble}>{t('tutorial_step4_chat_msg1')}</div>
          </div>
          <div className={`${styles.chatMessage} ${styles.sent}`}>
            <div className={styles.chatBubble}>{t('tutorial_step4_chat_msg2')}</div>
          </div>
        </div>
        <div className={styles.chatInputMockup}>{t('chat_input_placeholder')}</div>
      </div>
      <p className={styles.bottomText}>{t('tutorial_step4_bottom_text')}</p>
    </div>
  );
};

const TutorialStep5 = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step5_title')}</h2>
      <p className={styles.stepSubtitle}>{t('tutorial_step5_subtitle')}</p>
      <div className={styles.profileMockup}> {/* Corrigido: className */}
        <div className={styles.profileHeader}>
          <span className={styles.profileSymbol}>★</span>
          <span className={styles.profileName}>{t('tutorial_step5_mock_name')}</span>
        </div>
        <div className={styles.profileSectionMockup}>
          <h4>{t('profile_bio_label')}</h4>
          <p>{t('tutorial_step5_mock_bio')}</p>
        </div>
        <div className={styles.profileSectionMockup}>
          <h4>{t('profile_couple_link_section_title')}</h4>
          <p>{t('profile_couple_linked_with')} <strong>{t('tutorial_step5_mock_partner')} (▲)</strong></p>
          <button className={`${styles.unlinkButtonMockup} genericButton`} disabled>{t('link_couple_unlink_button')}</button>
        </div>
        <div className={styles.profileSectionMockup}>
          <h4>{t('profile_intensity_filter_section_title')}</h4>
          <p>{t('tutorial_step5_intensity_desc')}</p>
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
};

const TutorialStep6 = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>{t('tutorial_step6_title')}</h2>
      <p className={styles.stepSubtitle}>{t('tutorial_step6_subtitle')}</p>
    </div>
  );
};


interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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
        <button onClick={onClose} className={styles.closeButton} aria-label={t('tutorial_close_aria')}>&times;</button>
        <div className={styles.stepIndicator}>{t('tutorial_step_indicator', { current: currentStep, total: totalSteps })}</div>
        <div className={styles.stepContent}>{renderStepContent()}</div>
        <div className={styles.navigation}>
          {currentStep > 1 && <button onClick={handlePrev} className={`${styles.navButton} genericButton`}>{t('tutorial_prev_button')}</button>}
          <button onClick={handleNext} className={`${styles.navButton} ${styles.primaryNavButton} genericButton`}>
            {currentStep === totalSteps ? t('tutorial_finish_button') : t('tutorial_next_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;