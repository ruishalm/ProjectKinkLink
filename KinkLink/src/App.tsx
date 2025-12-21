// App.tsx
import React, { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react'; // Adicionado useState, useCallback, useEffect
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import type { Card } from './data/cards'; // Importa o tipo Card
import './App.css';
import { Toaster } from 'react-hot-toast';
import './config/skins/styles/panel-styles.css';
import './config/skins/styles/button-styles.css';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CardPilePage from './pages/CardPilePage';
import RegisterPage from './pages/RegisterPage';
import LinkCouplePage from './pages/LinkCouplePage';
import MatchesPage from './pages/MatchesPage';
import LinkedRoute from './components/LinkedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import UnlinkedRoute from './components/UnlinkedRoute';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportPage from './pages/SupportPage';
import SkinsPage from './pages/SkinsPage';
import { SkinProvider } from './contexts/SkinContext';
import { NotificationProvider } from './contexts/NotificationContext'; // <<< IMPORTAR O NOVO PROVIDER
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer'; // <<< IMPORT PARA O RODAPÉ
import SupportModal from './components/modals/SupportModal';
import UnlockNotificationModal from './components/UnlockNotificationModal';
import UserTicketsModal from './components/UserTicketsModal'; // <<< IMPORT DO NOVO MODAL
import AdminRoute from './components/AdminRoute';
import FeedbackModal from './components/FeedbackModal'; // <<< IMPORT PARA O MODAL
import NewMatchModal from './hooks/NewMatchModal'; // Modal para exibir novos links
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';


const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

function AppContent() {
  const { user, isLoading, submitUserFeedback } = useAuth(); // submitUserFeedback do AuthContext
  const location = useLocation();
  const { t } = useTranslation();
  const isUserLinked = !!user?.coupleId; // Nova arquitetura: usa coupleId ao invés de partnerId
  const [deferredInstallPrompt, setDeferredInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButtonInHeader, setShowInstallButtonInHeader] = React.useState(false);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  // Estado para o modal de feedback - DEVE ESTAR NO TOPO DA FUNÇÃO
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isUserTicketsModalOpen, setIsUserTicketsModalOpen] = useState(false); // <<< NOVO ESTADO
  const [newMatchesForModal, setNewMatchesForModal] = useState<Card[]>([]); // Estado para o modal de "Novo Link!"

  // evita múltiplos writes repetidos ao entrar na rota /matches
  const matchesVisitedRef = useRef(false);
  const IN_FLIGHT_LOCK_KEY = 'lk_lastVisited_lock';
  const MATCHES_UPDATE_THRESHOLD_SECONDS = 30;


  useEffect(() => {
    if (!user?.id) return;

    if (location.pathname !== '/matches') {
      matchesVisitedRef.current = false;
      return;
    }

    if (matchesVisitedRef.current) return;

    // check localStorage lock (prevenir múltiplas instâncias/tabs)
    const lock = localStorage.getItem(IN_FLIGHT_LOCK_KEY);
    const lockTs = lock ? Number(lock) : 0;
    if (Date.now() - lockTs < MATCHES_UPDATE_THRESHOLD_SECONDS * 1000) {
      console.debug('[App] lastVisited update suppressed by local lock');
      matchesVisitedRef.current = true;
      return;
    }

    type LastVisitedType = Timestamp | number | string | undefined;
    const lastVisited = user.lastVisitedMatchesPage as LastVisitedType;
    let lastVisitedMs = 0;
    if (lastVisited) {
      if (lastVisited instanceof Timestamp) {
        lastVisitedMs = (lastVisited as Timestamp).toMillis();
      } else if (typeof lastVisited === 'number' || typeof lastVisited === 'string') {
        lastVisitedMs = typeof lastVisited === 'string' ? Number(lastVisited) : lastVisited;
      } else {
        const parsed = Date.parse(String(lastVisited));
        lastVisitedMs = Number.isFinite(parsed) ? parsed : 0;
      }
    }

    if (Date.now() - lastVisitedMs <= MATCHES_UPDATE_THRESHOLD_SECONDS * 1000) {
      matchesVisitedRef.current = true;
      return;
    }

    // acquire lock and write
    localStorage.setItem(IN_FLIGHT_LOCK_KEY, String(Date.now()));
    matchesVisitedRef.current = true;
    const userRef = doc(db, 'users', user.id);
    updateDoc(userRef, { lastVisitedMatchesPage: serverTimestamp() })
      .catch((err) => console.warn('[App] erro ao atualizar lastVisitedMatchesPage', err))
      .finally(() => {
        // release lock após threshold para prevenir re-writes rápidos
        setTimeout(() => {
          localStorage.removeItem(IN_FLIGHT_LOCK_KEY);
          matchesVisitedRef.current = false;
        }, MATCHES_UPDATE_THRESHOLD_SECONDS * 1000);
      });
  }, [location.pathname, user?.id]); // removido user.lastVisitedMatchesPage para não re-disparar quando o user for atualizado

  // useEffect para o prompt de instalação PWA - ESTÁ SENDO USADO
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButtonInHeader(true);
      console.log('[App] beforeinstallprompt event fired and deferred. Button will be shown.');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Efeito para abrir o modal de apoio baseado no hash da URL
  React.useEffect(() => {
    if (location.hash === '#openSupportModal') {
      setIsSupportModalOpen(true);
      // Limpa o hash para não reabrir em um refresh
      window.history.replaceState(null, '', location.pathname + location.search);
    }
  }, [location]);
  // Hook customizado, chamado incondicionalmente
  useLinkCompletionListener(setNewMatchesForModal);

  // Funções para o modal de feedback - DEVEM ESTAR NO TOPO DA FUNÇÃO, ANTES DE QUALQUER RETURN CONDICIONAL
  const handleOpenFeedbackModal = useCallback(() => {
    if (user) {
      setIsFeedbackModalOpen(true);
    } else {
      alert(t('feedback_login_required'));
    }
  }, [user, t]);

  const handleCloseFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(false);
  }, []); // Dependência vazia é correta aqui

  // Funções para o modal de UserTickets
  const handleOpenUserTicketsModal = useCallback(() => {
    if (user) setIsUserTicketsModalOpen(true);
  }, [user]);

  const handleCloseUserTicketsModal = useCallback(() => {
    setIsUserTicketsModalOpen(false);
  }, []);

  const handleSubmitFeedbackToContext = useCallback(async (feedbackText: string) => {
    if (!submitUserFeedback) {
        console.error("[App] Função submitUserFeedback não está disponível no AuthContext");
        throw new Error(t('feedback_submit_error'));
    }
    await submitUserFeedback(feedbackText);
  }, [submitUserFeedback, t]);


  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>{t('loading_app')}</div>;
  }

  console.log('Dev log - App states: User loaded, isUserLinked:', isUserLinked);

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      console.log('[App] handleInstallClick: Prompting user to install.');
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredInstallPrompt(null);
      setShowInstallButtonInHeader(false);
    }
  };

  return (
    <div className="appContainer">
      <NotificationProvider> {/* <<< ENVOLVER COM O NOTIFICATION PROVIDER */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--cor-fundo-elemento)',
              color: 'var(--cor-texto-primario)',
              border: '1px solid var(--cor-borda)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        />
        <UnlockNotificationModal />
        <Header
          showInstallButton={showInstallButtonInHeader}
          onInstallClick={handleInstallClick}
          onOpenFeedbackModal={handleOpenFeedbackModal} // Passa a função para o Header
          onOpenUserTicketsModal={handleOpenUserTicketsModal} // <<< NOVA PROP
        />
        <main className="appMainContent">
          <Suspense fallback={<div className="page-container-centered">{t('loading_page')}</div>}>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/termos-de-servico" element={<TermsOfServicePage />} />
              <Route path="/suporte" element={<SupportPage />} />

              {/* Rotas Protegidas por Autenticação */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/link-couple" element={<LinkCouplePage />} /> {/* Rota para Meus Tickets removida */}

                {/* Rotas que exigem que o usuário esteja vinculado */}
                <Route element={<LinkedRoute />}>
                  <Route path="/cards" element={<CardPilePage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/skins" element={<SkinsPage />} />
                </Route>

                {/* Rotas que exigem que o usuário NÃO esteja vinculado */}
                <Route element={<UnlinkedRoute />}>
                  {/* Outras rotas que só devem ser acessadas por usuários não vinculados podem ir aqui */}
                </Route>
              </Route>

              {/* ROTA DE ADMINISTRAÇÃO */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>

              {/* Fallback para rotas não encontradas */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {location.pathname === '/cards' && (
            <div className="actionButtons">
              {/* Botões de ação para a página de cartas, se aplicável globalmente aqui */}
            </div>
          )}
        </main>
        {/* Renderiza o modal de feedback */}
        {isFeedbackModalOpen && user && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={handleCloseFeedbackModal}
            onSubmitFeedback={handleSubmitFeedbackToContext}
            // Opcional: preencher com último feedback não visto ou um rascunho
            // initialText={user.feedbackTickets?.find(ticket => ticket.status === 'new')?.text || ''}
          />
        )}
        {/* Renderiza o modal de UserTickets */}
        {isUserTicketsModalOpen && user && (
          <UserTicketsModal
            isOpen={isUserTicketsModalOpen}
            onClose={handleCloseUserTicketsModal}
          />
        )}
        {isSupportModalOpen && (
          <SupportModal
            isOpen={isSupportModalOpen}
            onClose={() => setIsSupportModalOpen(false)} />
        )}
        {/* Renderiza o modal de Novo Link! */}
        {newMatchesForModal.length > 0 && (
          <NewMatchModal
            matches={newMatchesForModal}
            onClose={() => setNewMatchesForModal([])}
          />
        )}
        <Footer /> {/* <<< RODAPÉ ADICIONADO AQUI */}
      </NotificationProvider> {/* <<< FECHAR O NOTIFICATION PROVIDER */}
    </div>
  );
}

function App() {
  return (
    <SkinProvider>
      {/* O Router deve estar aqui, mas como já está no main.tsx, não o adicionamos de novo */}
      <AppContent />
    </SkinProvider>
  );
}
export default App;
