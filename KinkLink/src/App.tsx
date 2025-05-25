import { Routes, Route } from 'react-router-dom';
// Importaremos os componentes das páginas aqui depois
import { useAuth } from './contexts/AuthContext'; // Importa o hook do seu AuthContext
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import CardPilePage from './pages/CardPilePage';
import LinkCouplePage from './pages/LinkCouplePage';
import MatchesPage from './pages/MatchesPage';
import LinkedRoute from './components/LinkedRoute'; // Importa o LinkedRoute
import { useLinkCompletionListener } from './hooks/useLinkCompletionListener'; // Importa o hook do listener
// Presumindo que você tem um componente Header para a navegação principal
// import Header from './components/Header'; 

// Componente Header placeholder - substitua pelo seu real
const HeaderPlaceholder = () => (
  <header style={{
    padding: '10px 20px',
    backgroundColor: '#222', // Mantém o fundo escuro para contraste
    color: 'red', // Cor do texto vermelha
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '2em', // Fonte grande
    fontWeight: 'bold' // Negrito
  }}>
    Kink🔗Link
  </header>
);

function App() {
  const { user, isLoading } = useAuth(); // Pega o usuário e o estado de carregamento do AuthContext

  // Determina se o usuário está vinculado.
  // Presume-se que o AuthContext atualiza o objeto 'user' com 'linkedPartnerId'
  // quando o documento do usuário no Firestore é alterado.
  const isUserLinked = !!user?.linkedPartnerId;

  // Hook para o listener de conclusão de link (para o Usuário A - iniciador)
  // Este listener roda globalmente se o usuário estiver logado e não vinculado.
  useLinkCompletionListener(
    user, // Passa o objeto User do Firebase (ou seu tipo customizado do AuthContext)
    isUserLinked,
    (completedCoupleId, completedPartnerId) => {
      console.log('App.tsx: Callback do useLinkCompletionListener!', `CoupleID: ${completedCoupleId}, PartnerID: ${completedPartnerId}`);
      // O AuthContext já deve ter atualizado o estado do 'user' (e consequentemente 'isUserLinked')
      // devido à mudança no Firestore feita por 'completeLinkForInitiator'.
      // Este callback pode ser usado para lógica adicional se necessário (ex: analytics, notificações de UI específicas).
    }
  );

  if (isLoading) {
    // Mostra um loader global enquanto o AuthContext verifica o estado de autenticação
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>Carregando KinkLink...</div>;
  }

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
