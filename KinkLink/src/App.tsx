import { Routes, Route } from 'react-router-dom';
// Importaremos os componentes das páginas aqui depois
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import CardPilePage from './pages/CardPilePage';
import LinkCouplePage from './pages/LinkCouplePage';
import MatchesPage from './pages/MatchesPage';
import LinkedRoute from './components/LinkedRoute'; // Importa o LinkedRoute

// Presumindo que você tem um componente Header para a navegação principal
// import Header from './components/Header'; 

// Componente Header placeholder - substitua pelo seu real
const HeaderPlaceholder = () => (
  <header style={{ padding: '10px 20px', backgroundColor: '#222', color: 'white', textAlign: 'center', marginBottom: '20px' }}>
    KinkLink Header (Substitua este placeholder)
  </header>
);

function App() {
  return (
    <> {/* Envolve com um Fragmento ou div se o Header estiver fora do Routes */}
      <HeaderPlaceholder /> {/* Seu componente Header aqui para aparecer em todas as páginas */}
      <main> {/* Adiciona um <main> para o conteúdo da página */}
        <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
          <LinkedRoute> {/* Alterado para LinkedRoute */}
            <CardPilePage />
          </LinkedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <LinkedRoute> {/* Alterado para LinkedRoute */}
            <MatchesPage />
          </LinkedRoute>
        }
      />
      {/* Opcional: Rota para lidar com URLs não encontradas */}
      <Route path="*" element={<div>Página não encontrada</div>} />
        </Routes>
      </main>
    </>
  )
}

export default App
