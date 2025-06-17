/**
 * Import function triggers from their respective submodules:
 *
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onDocumentWritten} from "firebase-functions/v2/firestore"; // Alteração aqui
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function para notificar um usuário quando um novo match é formado.
 * Acionada quando um documento em 'couples/{coupleId}/likedInteractions/{cardId}' é escrito (criado ou atualizado).
 */
export const onNewMatch = onDocumentWritten(
  {
    region: "southamerica-east1", // Especifica a região da função
    document: "couples/{coupleId}/likedInteractions/{cardId}",
  },
  async (event) => {
    logger.info(
      `Match event triggered for couple ${event.params.coupleId}, card ${event.params.cardId}`,
      { eventId: event.id }
    );

    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Verifica se é um novo match:
    // 1. O documento deve existir após a escrita (afterData deve existir).
    // 2. 'isMatch' deve ser true no afterData.
    // 3. 'isMatch' não era true antes (ou o documento não existia antes com isMatch=true).
    const isNewDocument = !event.data?.before.exists;
    const wasNotMatchBefore = isNewDocument || beforeData?.isMatch === false;
    const isMatchNow = afterData?.isMatch === true;

    if (afterData && isMatchNow && wasNotMatchBefore) {
      logger.info("New match confirmed!");

      const likedByUIDs = afterData.likedByUIDs as string[];
      if (!likedByUIDs || likedByUIDs.length !== 2) {
        logger.error("likedByUIDs is not as expected for a match.", { likedByUIDs });
        return;
      }

      // Determina quem completou o match (completador) e quem deve ser notificado (pioneiro).
      // O pioneiro é o primeiro usuário que curtiu.
      // O completador é o segundo usuário que curtiu, formando o match.
      let pioneerUID: string | undefined;
      let completadorUID: string | undefined;

      const beforeLikedByUIDs = beforeData?.likedByUIDs as string[] | undefined;

      if (beforeLikedByUIDs && beforeLikedByUIDs.length === 1 && likedByUIDs.length === 2) {
        pioneerUID = beforeLikedByUIDs[0];
        // O completador é o UID em likedByUIDs que não está em beforeLikedByUIDs
        completadorUID = likedByUIDs.find(uid => uid !== pioneerUID);
      } else if (isNewDocument && likedByUIDs.length === 2) {
        // Caso raro: documento de match criado diretamente com 2 UIDs.
        // Não podemos determinar quem foi o "pioneiro" no sentido de quem curtiu primeiro.
        // Para este cenário, podemos decidir não notificar ou ter outra lógica.
        // Por enquanto, vamos logar e não notificar para evitar notificação indesejada.
        logger.warn("Match document created directly with two UIDs. Cannot determine pioneer for notification.", { likedByUIDs });
        return;
      }

      if (!pioneerUID || !completadorUID) {
        logger.error("Could not reliably determine pioneer or completador UID.", { beforeLikedByUIDs, likedByUIDs, pioneerUID, completadorUID });
        return;
      }

      logger.info(`Pioneer (to notify): ${pioneerUID}, Completador (triggered match): ${completadorUID}`);

      // Buscar tokens FCM do usuário pioneiro
      const tokensSnapshot = await db.collection(`users/${pioneerUID}/fcmTokens`).get();
      if (tokensSnapshot.empty) {
        logger.info(`No FCM tokens found for pioneer user ${pioneerUID}.`);
        return;
      }
      const tokens = tokensSnapshot.docs.map(doc => doc.id); // O ID do documento é o próprio token

      // Buscar nome de usuário do completador para a mensagem
      let completadorUsername = "Alguém";
      try {
        const completadorDoc = await db.doc(`users/${completadorUID}`).get();
        if (completadorDoc.exists) {
          completadorUsername = completadorDoc.data()?.username || "Alguém";
        }
      } catch (error) {
        logger.error(`Error fetching completador's (${completadorUID}) username:`, error);
      }

      // Ajuste para usar o texto do card como título, truncado
      const cardData = afterData.cardData as { text?: string, category?: string }; // Ajuste conforme a estrutura real
      let cardTitle = "um card";
      if (cardData?.text) {
        cardTitle = cardData.text.length > 50 ? cardData.text.substring(0, 47) + "..." : cardData.text;
      } else if (cardData?.category) {
        cardTitle = `um card de ${cardData.category}`;
      }

      const payload = {
        notification: {
          title: "É um Match! ❤️",
          body: `Você e ${completadorUsername} deram match no card "${cardTitle}". Confira!`,
          // Adicione um ícone se desejar: icon: "URL_DO_SEU_ICONE.png"
        },
        data: { // Dados para deep linking no cliente
          type: "match_notification",
          coupleId: event.params.coupleId,
          cardId: event.params.cardId, // ID do card que deu match
        },
      };

      logger.info(`Sending notification to ${pioneerUID} with tokens: ${tokens.join(', ')}`, { payload });
      const response = await messaging.sendToDevice(tokens, payload);

      // Limpar tokens inválidos
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          logger.error(`Failed to send notification to token ${tokens[index]} for user ${pioneerUID}:`, error.message);
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            logger.info(`Deleting invalid token: ${tokens[index]} for user ${pioneerUID}`);
            db.collection(`users/${pioneerUID}/fcmTokens`).doc(tokens[index]).delete()
              .catch(deleteErr => logger.error(`Error deleting token ${tokens[index]}:`, deleteErr));
          }
        }
      });
    } else {
      logger.info("Event did not meet criteria for a new match notification.", {
        afterDataExists: !!afterData,
        isMatchNow,
        wasNotMatchBefore,
      });
    }
    return null;
  }
);
