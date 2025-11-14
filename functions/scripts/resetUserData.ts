import * as admin from 'firebase-admin';
import * as path from 'path';

// --- CONFIGURAÇÃO ---
const serviceAccountPath = path.resolve(__dirname, '../../kinklink-a4607-firebase-adminsdk-fbsvc-13400b61c8.json');

// Inicializa o Firebase Admin SDK
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar o Firebase Admin SDK:', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Deleta de forma recursiva todos os documentos de uma coleção em lotes.
 */
async function deleteCollection(collectionRef: admin.firestore.CollectionReference, batchSize: number) {
  const query = collectionRef.limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: () => void) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function resetAllUserData() {
  console.log('--- INICIANDO RESET DE DADOS DE USUÁRIOS E CASAIS ---');

  // --- ETAPA 1: RESETAR DADOS DE USUÁRIOS ---
  try {
    console.log('\n--- Etapa 1: Resetando "seenCards" e contadores de todos os usuários... ---');
    const usersSnapshot = await db.collection('users').get();
    if (!usersSnapshot.empty) {
      const usersBatch = db.batch();
      usersSnapshot.docs.forEach(doc => {
        usersBatch.update(doc.ref, {
          seenCards: [],
          conexaoAccepted: 0,
          conexaoRejected: 0,
          lastVisitedMatchesPage: null // Reseta a data da última visita
        });
      });
      await usersBatch.commit();
      console.log(`✅ Dados de ${usersSnapshot.size} usuários foram resetados.`);
    } else {
      console.log('Nenhum usuário encontrado para resetar.');
    }
  } catch (error) {
    console.error('❌ Erro na Etapa 1 (Resetar Usuários):', error);
    return;
  }

  // --- ETAPA 2: RESETAR DADOS DE CASAIS (INTERAÇÕES E CHATS) ---
  try {
    console.log('\n--- Etapa 2: Limpando interações e chats de todos os casais... ---');
    const couplesSnapshot = await db.collection('couples').get();
    if (!couplesSnapshot.empty) {
      let processedCouples = 0;
      for (const coupleDoc of couplesSnapshot.docs) {
        console.log(`Limpando subcoleções do casal ${coupleDoc.id}...`);
        await deleteCollection(coupleDoc.ref.collection('likedInteractions'), 100);
        await deleteCollection(coupleDoc.ref.collection('cardChats'), 100);
        processedCouples++;
        console.log(`(${processedCouples}/${couplesSnapshot.size}) Casal ${coupleDoc.id} limpo.`);
      }
      console.log(`✅ Subcoleções de ${processedCouples} casais foram limpas.`);
    } else {
      console.log('Nenhum casal encontrado para resetar.');
    }
  } catch (error) {
    console.error('❌ Erro na Etapa 2 (Resetar Casais):', error);
    return;
  }

  console.log('\n--- PROCESSO DE RESET CONCLUÍDO COM SUCESSO! ---');
}

// Executa a função principal
resetAllUserData().catch(console.error);
