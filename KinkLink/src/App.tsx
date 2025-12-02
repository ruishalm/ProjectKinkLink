// App.tsx
import React, { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import type { Card } from './data/cards';
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
import { NotificationProvider } from './contexts/NotificationContext';
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import SupportModal from './components/modals/SupportModal';
import UnlockNotificationModal from './components/UnlockNotificationModal';
import UserTicketsModal from './components/UserTicketsModal';
import AdminRoute from './components/AdminRoute';
import FeedbackModal from './components/FeedbackModal';
import NewMatchModal from './hooks/NewMatchModal';
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
  const { user, isLoading, submitUserFeedback } = useAuth();
  const location = useLocation();
  const isUserLinked = !!user?.partnerId;
  const [deferredInstallPrompt, setDeferredInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButtonInHeader, setShowInstallButtonInHeader] = React.useState(false);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isUserTicketsModalOpen, setIsUserTicketsModalOpen] = useState(false);
  const [newMatchesForModal, setNewMatchesForModal] = useState<Card[]>([]);

  // Ref e constantes para a lógica de atualização de 'lastVisitedMatchesPage'.
  // Usado para marcar a última vez que o usuário visitou a página de matches,
  // controlando a exibição de notificações de novos matches.
  const matchesVisitedRef = useRef(false);
  const IN_FLIGHT_LOCK_KEY = 'lk_lastVisited_lock';
  const MATCHES_UPDATE_THRESHOLD_SECONDS = 30;

  // Efeito para atualizar o campo `lastVisitedMatchesPage` do usuário no Firestore.
  // Roda apenas quando o usuário entra na rota '/matches' e previne escritas
  // repetidas usando um lock no localStorage e um threshold de tempo.
  useEffect(() => {
    if (!user?.id) return;

    if (location.pathname !== '/matches') {
      matchesVisitedRef.current = false;
      return;
    }

    if (matchesVisitedRef.current) return;

    // Previne escritas concorrentes entre abas/instâncias diferentes.
    const lock = localStorage.getItem(IN_FLIGHT_LOCK_KEY);
    const lockTs = lock ? Number(lock) : 0;
    if (Date.now() - lockTs < MATCHES_UPDATE_THRESHOLD_SECONDS * 1000) {
      console.debug('[App] lastVisited update suppressed by local lock');
      matchesVisitedRef.current = true;
      return;
    }

    // Verifica o timestamp da última visita para evitar atualizações desnecessárias.
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

    // Adquire o lock e atualiza o timestamp no Firestore.
    localStorage.setItem(IN_FLIGHT_LOCK_KEY, String(Date.now()));
    matchesVisitedRef.current = true;
    const userRef = doc(db, 'users', user.id);
    updateDoc(userRef, { lastVisitedMatchesPage: serverTimestamp() })
      .catch((err) => console.warn('[App] erro ao atualizar lastVisitedMatchesPage', err))
      .finally(() => {
        // Libera o lock após o threshold para permitir futuras atualizações.
        setTimeout(() => {
          localStorage.removeItem(IN_FLIGHT_LOCK_KEY);
          matchesVisitedRef.current = false;
        }, MATCHES_UPDATE_THRESHOLD_SECONDS * 1000);
      });
  }, [location.pathname, user?.id]);

  // Efeito para gerenciar o prompt de instalação do PWA.
  // Ouve o evento 'beforeinstallprompt' e o armazena para que o botão de
  // instalação possa ser exibido e acionado pelo usuário no momento desejado.
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

  // Efeito para abrir o modal de apoio se a URL contiver o hash '#openSupportModal'.
  // Útil para links diretos que devem acionar o modal.
  React.useEffect(() => {
    if (location.hash === '#openSupportModal') {
      setIsSupportModalOpen(true);
      // Limpa o hash para evitar que o modal reabra em um refresh da página.
      window.history.replaceState(null, '', location.pathname + location.search);
    }
  }, [location]);
  
  // Hook que ouve por eventos de conclusão de vínculo para exibir o modal de novo match.
  useLinkCompletionListener(setNewMatchesForModal);

  // Handlers para o modal de feedback.
  const handleOpenFeedbackModal = useCallback(() => {
    if (user) {
      setIsFeedbackModalOpen(true);
    } else {
      alert('Você precisa estar logado para enviar feedback.');
    }
  }, [user]);

  const handleCloseFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(false);
  }, []);

  // Handlers para o modal de tickets do usuário.
  const handleOpenUserTicketsModal = useCallback(() => {
    if (user) setIsUserTicketsModalOpen(true);
  }, [user]);

  const handleCloseUserTicketsModal = useCallback(() => {
    setIsUserTicketsModalOpen(false);
  }, []);

  const handleSubmitFeedbackToContext = useCallback(async (feedbackText: string) => {
    if (!submitUserFeedback) {
        console.error("[App] Função submitUserFeedback não está disponível no AuthContext");
        throw new Error('Não foi possível enviar o feedback no momento.');
    }
    await submitUserFeedback(feedbackText);
  }, [submitUserFeedback]);


  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>Carregando KinkLink...</div>;
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
      <NotificationProvider>
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
          onOpenFeedbackModal={handleOpenFeedbackModal}
          onOpenUserTicketsModal={handleOpenUserTicketsModal}
        />
        <main className="appMainContent">
          <Suspense fallback={<div className="page-container-centered">Carregando página...</div>}>
            <Routes>
              {/* Rotas Públicas: Acessíveis a todos os usuários. */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/termos-de-servico" element={<TermsOfServicePage />} />
              <Route path="/suporte" element={<SupportPage />} />

              {/* Rotas Protegidas: Exigem autenticação. */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/link-couple" element={<LinkCouplePage />} />

                {/* Rotas para usuários com parceiro(a) vinculado(a). */}
                <Route element={<LinkedRoute />}>
                  <Route path="/cards" element={<CardPilePage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/skins" element={<SkinsPage />} />
                </Route>

                {/* Rotas para usuários sem parceiro(a) vinculado(a). */}
                <Route element={<UnlinkedRoute />}>
                  {/* Adicionar aqui outras rotas para usuários não-vinculados. */}
                </Route>
              </Route>

              {/* Rota de Administração: Apenas para usuários com permissão de admin. */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>

              {/* Rota Fallback: Redireciona para a home page se nenhuma outra rota corresponder. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {location.pathname === '/cards' && (
            <div className="actionButtons">
              {/* Espaço reservado para botões de ação globais na página de cartas. */}
            </div>
          )}
        </main>
        
        {/* Seção de Modais: Renderizados condicionalmente sobre o conteúdo principal. */}
        {isFeedbackModalOpen && user && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={handleCloseFeedbackModal}
            onSubmitFeedback={handleSubmitFeedbackToContext}
          />
        )}
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
        {newMatchesForModal.length > 0 && (
          <NewMatchModal
            matches={newMatchesForModal}
            onClose={() => setNewMatchesForModal([])}
          />
        )}
        <Footer />
      </NotificationProvider>
    </div>
  );
}

function App() {
  return (
    <SkinProvider>
      {/* O BrowserRouter é provido no main.tsx, envolvendo toda a aplicação. */}
      <AppContent />
    </SkinProvider>
  );
}
export default App;
