import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation, } from 'react-i18next';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './SymbolExplainerModal.module.css';

interface SymbolExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SymbolExplainerModal: React.FC<SymbolExplainerModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [partnerName, setPartnerName] = useState<string>('');
  const [userSymbol, setUserSymbol] = useState<string>('');
  const [partnerSymbol, setPartnerSymbol] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupleData = async () => {
      if (!user?.coupleId || !user?.id) return;

      try {
        const coupleDoc = await getDoc(doc(db, 'couples', user.coupleId));
        if (coupleDoc.exists()) {
          const coupleData = coupleDoc.data();
          const members = coupleData.members || [];
          const memberSymbols = coupleData.memberSymbols || {};

          // Encontrar o parceiro (o outro membro que não é o usuário atual)
          const partnerId = members.find((id: string) => id !== user.id);
          
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, 'users', partnerId));
            if (partnerDoc.exists()) {
              setPartnerName(partnerDoc.data().name || t('symbol_explainer_partner_default'));
            }
            setPartnerSymbol(memberSymbols[partnerId] || '');
          }

          setUserSymbol(memberSymbols[user.id] || '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do casal:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCoupleData();
    }
  }, [isOpen, user?.coupleId, user?.id, t]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        
        <h2 className={styles.title}>{t('symbol_explainer_title')}</h2>
        
        {loading ? (
          <p className={styles.loading}>{t('symbol_explainer_loading')}</p>
        ) : (
          <div className={styles.content}>
            <div className={styles.symbolRow}>
              <span className={styles.symbol}>{userSymbol}</span>
              <span className={styles.label}>{t('symbol_explainer_you')}</span>
            </div>
            
            <div className={styles.symbolRow}>
              <span className={styles.symbol}>{partnerSymbol}</span>
              <span className={styles.label}>{partnerName}</span>
            </div>
            
            <p className={styles.explanation}>
              {t('symbol_explainer_text')}
            </p>
            
            <p className={styles.note}>
              {t('symbol_explainer_note')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymbolExplainerModal;
