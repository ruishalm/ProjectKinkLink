/**
 * Script para corrigir matches perdidos devido ao bug do partnerId
 * 
 * O QUE FAZ:
 * - Busca todos os casais ativos
 * - Para cada casal, compara os likes dos 2 membros
 * - Encontra cartas que AMBOS curtiram mas não viraram match
 * - Cria os documentos de match faltantes em likedInteractions
 * 
 * COMO USAR:
 * 1. Compile: npm run build
 * 2. Execute: node lib/scripts/fixMissingMatches.js
 */

import * as admin from 'firebase-admin';

// Inicializa Firebase Admin (se ainda não foi)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface UserVotes {
  yesVotes?: string[];
  noVotes?: string[];
}

interface CoupleData {
  members: string[];
  status?: string;
}

interface LikedInteraction {
  likedByUIDs: string[];
  isMatch: boolean;
  cardData?: any;
}

async function fixMissingMatches() {
  console.log('🔧 INICIANDO CORREÇÃO DE MATCHES PERDIDOS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar todos os casais
    const couplesSnapshot = await db.collection('couples').get();
    console.log(`\n📊 Total de casais encontrados: ${couplesSnapshot.size}`);
    
    let totalCouplesProcessed = 0;
    let totalMatchesCreated = 0;
    let totalMatchesUpdated = 0;
    
    for (const coupleDoc of couplesSnapshot.docs) {
      const coupleId = coupleDoc.id;
      const coupleData = coupleDoc.data() as CoupleData;
      
      // Pula casais incompletos
      if (!coupleData.members || coupleData.members.length !== 2) {
        console.log(`⏭️  Pulando couple ${coupleId} - não tem 2 membros`);
        continue;
      }
      
      const [userId1, userId2] = coupleData.members;
      console.log(`\n👥 Processando couple: ${coupleId}`);
      console.log(`   Membros: ${userId1.substring(0, 8)}... e ${userId2.substring(0, 8)}...`);
      
      // 2. Buscar votes de ambos os usuários
      const user1Doc = await db.collection('users').doc(userId1).get();
      const user2Doc = await db.collection('users').doc(userId2).get();
      
      if (!user1Doc.exists || !user2Doc.exists) {
        console.log(`   ⚠️  Um dos usuários não existe, pulando...`);
        continue;
      }
      
      const user1Votes = (user1Doc.data() as UserVotes)?.yesVotes || [];
      const user2Votes = (user2Doc.data() as UserVotes)?.yesVotes || [];
      
      console.log(`   User 1: ${user1Votes.length} likes`);
      console.log(`   User 2: ${user2Votes.length} likes`);
      
      // 3. Encontrar cartas que AMBOS curtiram (matches potenciais)
      const potentialMatches = user1Votes.filter(cardId => user2Votes.includes(cardId));
      console.log(`   💕 Matches potenciais: ${potentialMatches.length}`);
      
      if (potentialMatches.length === 0) {
        console.log(`   ✅ Nenhum match potencial, pulando...`);
        totalCouplesProcessed++;
        continue;
      }
      
      // 4. Verificar quais já existem em likedInteractions
      const interactionsRef = db.collection('couples').doc(coupleId).collection('likedInteractions');
      const existingInteractionsSnap = await interactionsRef.get();
      
      const existingMatchIds = new Set<string>();
      existingInteractionsSnap.forEach(doc => {
        const data = doc.data() as LikedInteraction;
        if (data.isMatch || data.likedByUIDs?.length === 2) {
          existingMatchIds.add(doc.id);
        }
      });
      
      console.log(`   📋 Matches já existentes: ${existingMatchIds.size}`);
      
      // 5. Criar/atualizar matches faltantes
      let matchesCreatedForCouple = 0;
      let matchesUpdatedForCouple = 0;
      
      for (const cardId of potentialMatches) {
        const interactionDocRef = interactionsRef.doc(cardId);
        const interactionDoc = await interactionDocRef.get();
        
        if (!interactionDoc.exists) {
          // CRIAR novo documento de match
          console.log(`   ➕ Criando match para carta: ${cardId.substring(0, 10)}...`);
          
          // Buscar dados da carta
          let cardData = null;
          const standardCardDoc = await db.collection('cards').doc(cardId).get();
          if (standardCardDoc.exists) {
            cardData = standardCardDoc.data();
          } else {
            const userCardDoc = await db.collection('userCards').doc(cardId).get();
            if (userCardDoc.exists) {
              cardData = userCardDoc.data();
            }
          }
          
          await interactionDocRef.set({
            likedByUIDs: [userId1, userId2],
            isMatch: true,
            isHot: false,
            isCompleted: false,
            cardData: cardData ? {
              text: cardData.text,
              category: cardData.category,
              intensity: cardData.intensity,
              isCreatorSuggestion: cardData.isCreatorSuggestion
            } : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActivity: admin.firestore.FieldValue.serverTimestamp(),
            restoredByScript: true, // Flag para identificar matches restaurados
            restoredAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          matchesCreatedForCouple++;
          totalMatchesCreated++;
          
        } else {
          // ATUALIZAR documento existente se não estiver marcado como match
          const data = interactionDoc.data() as LikedInteraction;
          
          if (!data.isMatch || data.likedByUIDs?.length !== 2) {
            console.log(`   🔄 Atualizando match para carta: ${cardId.substring(0, 10)}...`);
            
            await interactionDocRef.update({
              likedByUIDs: [userId1, userId2],
              isMatch: true,
              lastActivity: admin.firestore.FieldValue.serverTimestamp(),
              fixedByScript: true, // Flag para identificar matches corrigidos
              fixedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            matchesUpdatedForCouple++;
            totalMatchesUpdated++;
          }
        }
      }
      
      console.log(`   ✅ Couple processado: ${matchesCreatedForCouple} criados, ${matchesUpdatedForCouple} atualizados`);
      totalCouplesProcessed++;
    }
    
    // 6. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESSO CONCLUÍDO');
    console.log('='.repeat(60));
    console.log(`📊 Casais processados: ${totalCouplesProcessed}`);
    console.log(`➕ Matches CRIADOS: ${totalMatchesCreated}`);
    console.log(`🔄 Matches ATUALIZADOS: ${totalMatchesUpdated}`);
    console.log(`💯 Total de matches corrigidos: ${totalMatchesCreated + totalMatchesUpdated}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRO durante o processo:', error);
    throw error;
  }
}

// Executa o script
fixMissingMatches()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado com erro:', error);
    process.exit(1);
  });
