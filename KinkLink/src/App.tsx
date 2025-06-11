// App.tsx
import React, { Suspense, lazy, useState, useCallback } from 'react'; // Adicionado useState, useCallback, useEffect
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
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
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener';
import Header from './components/Layout/Header';
import UnlockNotificationModal from './components/UnlockNotificationModal';
import AdminRoute from './components/AdminRoute';
import FeedbackModal from './components/FeedbackModal'; // <<< IMPORT PARA O MODAL
// import { useTranslation } from 'react-i18next'; // Removido, pois não usaremos t() para os alertas aqui


const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

function App() {
  const { user, isLoading, submitUserFeedback } = useAuth(); // submitUserFeedback do AuthContext
  const location = useLocation();
  const isUserLinked = !!user?.linkedPartnerId;
  const [deferredInstallPrompt, setDeferredInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButtonInHeader, setShowInstallButtonInHeader] = React.useState(false);
  // const { t } = useTranslation(); // Removido

  // Estado para o modal de feedback - DEVE ESTAR NO TOPO DA FUNÇÃO
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

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

  // Hook customizado, chamado incondicionalmente
  useLinkCompletionListener(
    user,
    isUserLinked,
    (completedCoupleId, completedPartnerId) => {
      console.log(`Vínculo concluído: CoupleID: ${completedCoupleId}, PartnerID: ${completedPartnerId}`);
    }
  );

  // Funções para o modal de feedback - DEVEM ESTAR NO TOPO DA FUNÇÃO, ANTES DE QUALQUER RETURN CONDICIONAL
  const handleOpenFeedbackModal = useCallback(() => {
    if (user) {
      setIsFeedbackModalOpen(true);
    } else {
      alert('Você precisa estar logado para enviar feedback.'); // String fixa
    }
  }, [user]); // Dependência 't' removida

  const handleCloseFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(false);
  }, []); // Dependência vazia é correta aqui

  const handleSubmitFeedbackToContext = useCallback(async (feedbackText: string) => {
    if (!submitUserFeedback) {
        console.error("[App] Função submitUserFeedback não está disponível no AuthContext");
        throw new Error('Não foi possível enviar o feedback no momento.'); // String fixa
    }
    await submitUserFeedback(feedbackText);
  }, [submitUserFeedback]); // Dependência 't' removida


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
    <SkinProvider>
      <div className="appContainer">
        <UnlockNotificationModal />
        <Header
          showInstallButton={showInstallButtonInHeader}
          onInstallClick={handleInstallClick}
          onOpenFeedbackModal={handleOpenFeedbackModal} // Passa a função para o Header
        />
        <main className="appMainContent">
          <Suspense fallback={<div className="page-container-centered">Carregando página...</div>}>
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
                <Route path="/link-couple" element={<LinkCouplePage />} />

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
      </div>
    </SkinProvider>
  );
}
export default App;
