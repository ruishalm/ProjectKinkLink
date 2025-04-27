import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Importar
import HomePage from './pages/HomePage';         // Importar página
import LoginPage from './pages/LoginPage';       // Importar página

function App() {
  return (
    <div>
      {/* <h1>KinkLink App</h1> Comentado ou removido - O título virá das páginas */}
      <Routes> {/* Container das rotas */}
        <Route path="/" element={<HomePage />} /> {/* Rota para a Home */}
        <Route path="/login" element={<LoginPage />} /> {/* Rota para Login */}
        {/* Adicionaremos mais rotas aqui depois (Perfil, Configurações, etc.) */}
      </Routes>
    </div>
  );
}

export default App;
