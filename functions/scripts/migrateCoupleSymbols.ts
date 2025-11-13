import * as admin from 'firebase-admin';
import * as path from 'path';

// --- CONFIGURAÇÃO ---
// O script busca o arquivo 'serviceAccountKey.json' na pasta 'functions'.
const serviceAccountPath = path.resolve(__dirname, '../kinklink-a4607-firebase-adminsdk-fbsvc-13400b61c8.json');

// Inicializa o Firebase Admin SDK
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar o Firebase Admin SDK. Verifique o caminho do arquivo de chave de serviço:', error);
  process.exit(1); // Sai do script se a inicialização falhar
}

const db = admin.firestore();

async function migrateCoupleSymbols() {
  console.log('Iniciando migração de símbolos para casais existentes...');

  try {
    const couplesRef = db.collection('couples');
    const couplesSnapshot = await couplesRef.get();

    if (couplesSnapshot.empty) {
      console.log('Nenhum casal encontrado para migrar.');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const batch = db.batch(); // Usar batch para atualizações eficientes

    for (const doc of couplesSnapshot.docs) {
      const coupleId = doc.id;
      const coupleData = doc.data();

      // Verifica se o campo memberSymbols já existe
      if (coupleData.memberSymbols) {
        console.log(`Casal ${coupleId} já possui memberSymbols. Pulando.`);
        skippedCount++;
        continue;
      }

      // Verifica se o casal tem dois membros para atribuir os símbolos
      if (coupleData.members && Array.isArray(coupleData.members) && coupleData.members.length === 2) {
        const [user1Id, user2Id] = coupleData.members;

        const newMemberSymbols = {
          [user1Id]: '★',
          [user2Id]: '▲',
        };

        const coupleDocRef = couplesRef.doc(coupleId);
        batch.update(coupleDocRef, { memberSymbols: newMemberSymbols });
        console.log(`Adicionado à fila de atualização: Casal ${coupleId} com símbolos: ${user1Id}: ★, ${user2Id}: ▲`);
        updatedCount++;
      } else {
        console.log(`Casal ${coupleId} não tem 2 membros válidos ou campo 'members' ausente. Pulando.`);
        skippedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Executando batch de ${updatedCount} atualizações...`);
      await batch.commit();
      console.log('Batch de atualizações concluído com sucesso.');
    } else {
      console.log('Nenhuma atualização necessária.');
    }

    console.log(`Migração concluída. Casais atualizados: ${updatedCount}, Casais pulados: ${skippedCount}.`);

  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

// Executa a função de migração
migrateCoupleSymbols().catch(console.error);