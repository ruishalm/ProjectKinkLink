// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\App.tsx
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
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
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportPage from './pages/SupportPage'; // Importar a SupportPage
import SkinsPage from './pages/SkinsPage';
import { SkinProvider } from './contexts/SkinContext'; // Importar SkinProvider
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener';
import Header from './components/Layout/Header'; // Importar o Header global
import UnlockNotificationModal from './components/UnlockNotificationModal'; // Importar o novo modal

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
        <main className="appMainContent">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/profile"
              element={
                <LinkedRoute>
                  <ProfilePage />
                </LinkedRoute>
              }
            />
            <Route
              path="/link-couple"
              element={
                <ProtectedRoute>
                  <LinkCouplePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards"
              element={
                <LinkedRoute>
                  <CardPilePage />
                </LinkedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <LinkedRoute>
                  <MatchesPage />
                </LinkedRoute>
              }
            />
            <Route
              path="/skins"
              element={
                <LinkedRoute>
                  <SkinsPage />
                </LinkedRoute>
              }
            />
            <Route path="/termos-de-servico" element={<TermsOfServicePage />} />
            <Route path="/suporte" element={<SupportPage />} /> {/* Adicionar a rota para SupportPage */}
            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
          {location.pathname === '/cards' && (
            <div className="actionButtons">
              {/* <button
                className="actionButton dislikeButton"
              >Passo</button> */}
              {/* <button
                className="actionButton likeButton"
              >Topo!</button> */}
            </div>
          )}
        </main>
      </div>
    </SkinProvider>
  );
}
export default App;
