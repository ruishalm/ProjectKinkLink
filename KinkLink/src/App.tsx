// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\App.tsx
import React, { Suspense, lazy } from 'react'; // Adicionado Suspense e lazy
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'; // Adicionado Navigate
import './App.css';
import './config/skins/styles/panel-styles.css'; // Importa os novos estilos de painel
import './config/skins/styles/button-styles.css'; // Importa os novos estilos de botão
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
import UnlinkedRoute from './components/UnlinkedRoute'; // Importar UnlinkedRoute
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportPage from './pages/SupportPage'; // Importar a SupportPage
import SkinsPage from './pages/SkinsPage';
import { SkinProvider } from './contexts/SkinContext'; // Importar SkinProvider
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener';
import Header from './components/Layout/Header'; // Importar o Header global
import UnlockNotificationModal from './components/UnlockNotificationModal'; // Importar o novo modal
import AdminRoute from './components/AdminRoute'; // <<< ADICIONE ESTE IMPORT
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage')); // <<< ADICIONE ESTE IMPORT (lazy load)
//import PasswordResetPage from './pages/PasswordResetPage'; // Importar PasswordResetPage

function App() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const isUserLinked = !!user?.linkedPartnerId;

  useLinkCompletionListener(
    user,
    isUserLinked,
    (completedCoupleId, completedPartnerId) => {
      console.log(`Vínculo concluído: CoupleID: ${completedCoupleId}, PartnerID: ${completedPartnerId}`);
    }
  );

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>Carregando KinkLink...</div>;
  }

  console.log('Dev log - App states: User loaded, isUserLinked:', isUserLinked);

  return (
    <SkinProvider> {/* SkinProvider envolve todo o conteúdo que precisa do contexto */}
      <div className="appContainer"> {/* Contêiner principal para flex layout */}
        <UnlockNotificationModal /> {/* Renderiza o modal de notificação de desbloqueio aqui */}
        <Header /> {/* Header global adicionado aqui */}
        <main className="appMainContent"> {/* Envolve o conteúdo principal */}
          <Suspense fallback={<div className="page-container-centered">Carregando página...</div>}>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/register" element={<RegisterPage />} /> {/* Considerar remover se SignupPage for a principal */}
              <Route path="/termos-de-servico" element={<TermsOfServicePage />} />
              <Route path="/suporte" element={<SupportPage />} />

              {/* Rotas Protegidas por Autenticação */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                {/* <Route path="/skins" element={<SkinsPage />} /> */} {/* Movido para LinkedRoute se depender de vínculo */}

                {/* Rotas que exigem que o usuário esteja vinculado */}
                <Route element={<LinkedRoute />}>
                  <Route path="/cards" element={<CardPilePage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/skins" element={<SkinsPage />} /> {/* Skins aqui se for para usuários vinculados */}
                  {/* <Route path="/chat/:matchId" element={<ChatPage />} />  // Exemplo se ChatPage existir */}
                </Route>

                {/* Rotas que exigem que o usuário NÃO esteja vinculado */}
                <Route element={<UnlinkedRoute />}>
                  <Route path="/link-couple" element={<LinkCouplePage />} />
                </Route>
              </Route>

              {/* ROTA DE ADMINISTRAÇÃO */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
                {/* Você pode adicionar mais rotas de admin aqui dentro no futuro */}
              </Route>

              {/* Fallback para rotas não encontradas */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {location.pathname === '/cards' && ( // Este bloco pode ser específico da CardPilePage
            <div className="actionButtons"> {/* Considerar mover para dentro da CardPilePage */}
              {/* Botões de ação para a página de cartas, se aplicável globalmente aqui */}
              {/* Exemplo:
              <button
                className="actionButton dislikeButton genericButton"
              >Passo</button> */}
              {/* <button
                className="actionButton likeButton genericButton"
              >Topo!</button> */}
            </div>
          )}
        </main>
      </div>
    </SkinProvider>
  );
}
export default App;
