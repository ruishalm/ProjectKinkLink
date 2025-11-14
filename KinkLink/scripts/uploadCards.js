// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\scripts\uploadCards.js

// Importações do firebase-admin
import fs from 'fs'; // Importa o módulo File System do Node.js
import { createRequire } from 'module'; // Importa createRequire
import path from 'path'; // Importa o módulo Path do Node.js
import { fileURLToPath } from 'url'; // Para lidar com caminhos em ES Modules
import admin from 'firebase-admin';

// Cria uma função require para usar com módulos CommonJS
const require = createRequire(import.meta.url);
const allKinkLinkCards = require('./cardsData.cjs'); // Atualiza para a extensão .cjs

// --- CONFIGURAÇÃO DO FIREBASE ADMIN ---
// Obter o caminho do diretório atual do script em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../../functions/kinklink-a4607-firebase-adminsdk-fbsvc-13400b61c8.json'); // Corrigido o caminho e o nome do arquivo
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const cardsCollectionRef = db.collection('cards'); // Nome da coleção no Firestore

async function uploadCards() {
  if (!allKinkLinkCards || allKinkLinkCards.length === 0) {
    console.log('Nenhuma carta encontrada em cardsData.js para upload.');
    return;
  }

  console.log(`Iniciando upload de ${allKinkLinkCards.length} cartas para a coleção "cards"...`);

  let batch = db.batch();
  let operationsCount = 0;

  for (const card of allKinkLinkCards) {
    // Valida se a carta tem um ID. Se não, pulamos esta carta.
    if (!card.id || typeof card.id !== 'string' || card.id.trim() === '') {
      console.warn('Carta sem ID válido encontrada, pulando:', card.text ? card.text.substring(0, 30) + '...' : 'Carta sem texto');
      continue;
    }

    // Usa o ID da carta do seu array como o ID do documento no Firestore
    const cardRef = cardsCollectionRef.doc(card.id);

    // Prepara os dados da carta para o Firestore, garantindo que apenas os campos esperados sejam enviados
    const cardData = {
      text: card.text || '', // Garante que text seja uma string
      category: card.category || 'geral', // Define uma categoria padrão se não houver
      // Adiciona intensity apenas se existir e for um número
      ...(typeof card.intensity === 'number' && { intensity: card.intensity }),
      // Você pode adicionar um campo 'createdAt' ou 'updatedAt' automaticamente se quiser
      // createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(cardRef, cardData); // Usa set() para criar ou sobrescrever o documento com o ID fornecido
    operationsCount++;

    // O Firestore tem um limite de 500 operações por batch.
    // Se você tiver mais de 500 cartas, precisará commitar em lotes.
    if (operationsCount >= 490) { // Um pouco abaixo do limite para segurança
      console.log(`Commitando lote de ${operationsCount} cartas...`);
      await batch.commit();
      batch = db.batch(); // Reinicia o batch para o próximo lote
      operationsCount = 0;
    }
  }

  // Commitar quaisquer operações restantes no batch
  if (operationsCount > 0) {
    console.log(`Commitando lote final de ${operationsCount} cartas...`);
    await batch.commit();
  }

  console.log('Upload de cartas concluído com sucesso!');
}

uploadCards().catch(error => {
  console.error('Erro durante o upload das cartas:', error);
});