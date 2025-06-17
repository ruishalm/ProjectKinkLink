/**
 * Import function triggers from their respective submodules:
 *
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onDocumentWritten} from "firebase-functions/v2/firestore";
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

    const beforeSnapshotData = event.data?.before.data();
    const afterSnapshotData = event.data?.after.data();

    // Verifica se é um novo match:
    // 1. O documento deve existir após a escrita (afterSnapshotData deve existir).
    // 2. 'isMatch' deve ser true no afterSnapshotData.
    // 3. 'isMatch' não era true antes (ou o documento não existia antes com isMatch=true).
    const isNewDocument = !event.data?.before.exists;
    const wasNotMatchBefore = isNewDocument || beforeSnapshotData?.isMatch === false;
    const isMatchNow = afterSnapshotData?.isMatch === true;

    if (afterSnapshotData && isMatchNow && wasNotMatchBefore) {
      logger.info("New match confirmed!");

      const likedByUIDs = afterSnapshotData.likedByUIDs as string[];
      if (!likedByUIDs || likedByUIDs.length !== 2) {
        logger.error("likedByUIDs is not as expected for a match.", { likedByUIDs });
        return;
      }

      let pioneerUID: string | undefined;
      let completadorUID: string | undefined;

      const beforeLikedByUIDs = beforeSnapshotData?.likedByUIDs as string[] | undefined;

      if (beforeLikedByUIDs && beforeLikedByUIDs.length === 1 && likedByUIDs.length === 2) {
        pioneerUID = beforeLikedByUIDs[0];
        completadorUID = likedByUIDs.find(uid => uid !== pioneerUID);
      } else if (isNewDocument && likedByUIDs.length === 2) {
        logger.warn("Match document created directly with two UIDs. Cannot determine pioneer for notification.", { likedByUIDs });
        return;
      }

      if (!pioneerUID || !completadorUID) {
        logger.error("Could not reliably determine pioneer or completador UID.", { beforeLikedByUIDs, likedByUIDs, pioneerUID, completadorUID });
        return;
      }

      logger.info(`Pioneer (to notify): ${pioneerUID}, Completador (triggered match): ${completadorUID}`);

      const tokensSnapshot = await db.collection(`users/${pioneerUID}/fcmTokens`).get();
      if (tokensSnapshot.empty) {
        logger.info(`No FCM tokens found for pioneer user ${pioneerUID}.`);
        return;
      }
      const tokens = tokensSnapshot.docs.map(doc => doc.id);

      let completadorUsername = "Alguém";
      try {
        const completadorDoc = await db.doc(`users/${completadorUID}`).get();
        if (completadorDoc.exists) {
          completadorUsername = completadorDoc.data()?.username || "Alguém";
        }
      } catch (error) {
        logger.error(`Error fetching completador's (${completadorUID}) username:`, error);
      }

      const cardData = afterSnapshotData.cardData as { text?: string; category?: string } | undefined;
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
          icon: "/icons/kinklogo192.png",
        },
        data: {
          type: "match_notification",
          coupleId: event.params.coupleId,
          cardId: event.params.cardId,
          url: `/matches#card-${event.params.cardId}` // Sugestão de URL para deep linking
        },
      };

      logger.info(`Sending notification to ${pioneerUID} with tokens: ${tokens.join(', ')}`, { payload });
      const response = await messaging.sendToDevice(tokens, payload);

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
        afterDataExists: !!afterSnapshotData,
        isMatchNow,
        wasNotMatchBefore,
      });
    }
    return null;
  }
);

/**
 * Cloud Function para notificar um usuário quando um de seus tickets de feedback
 * recebe uma resposta do administrador.
 * Acionada quando um documento em 'users/{userId}' é atualizado.
 */
export const onAdminTicketResponse = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "users/{userId}",
    cpu: 1,
    memory: "256MiB",
  },
  async (event) => {
    const userId = event.params.userId;
    logger.info(`User document update event for user ${userId}. Checking for ticket responses.`, { eventId: event.id });

    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!beforeSnapshot?.exists || !afterSnapshot?.exists) {
      logger.info("Document before or after snapshot does not exist (e.g., creation or deletion). Exiting ticket response check.", { userId, eventId: event.id });
      return null;
    }

    const beforeData = beforeSnapshot.data();
    const afterData = afterSnapshot.data();

    if (!beforeData || !afterData) {
      logger.info("beforeData or afterData is undefined. Exiting ticket response check.", { userId, eventId: event.id });
      return null;
    }

    if (!afterData.feedbackTickets) {
      logger.info("No feedbackTickets in afterData. Exiting.", { userId });
      return null;
    }

    const beforeTickets = (beforeData.feedbackTickets || []) as Array<{ id: string; adminResponse?: string; status: string; text: string }>;
    const afterTickets = (afterData.feedbackTickets || []) as Array<{ id: string; adminResponse?: string; status: string; text: string }>;

    let respondedTicket: { id: string; adminResponse?: string; status: string; text: string } | undefined;

    for (const afterTicket of afterTickets) {
      const beforeTicket = beforeTickets.find(bt => bt.id === afterTicket.id);
      // Condição para ser uma nova resposta do admin:
      // 1. O ticket tem uma adminResponse no estado "depois".
      // 2. O status do ticket no estado "depois" é 'admin_replied'.
      // 3. O ticket NÃO tinha uma adminResponse antes OU o status antes NÃO era 'admin_replied'.
      //    Isso garante que a notificação seja enviada apenas na primeira vez que o admin responde
      //    ou se o status for explicitamente alterado para 'admin_replied' novamente (menos comum).
      if (afterTicket.adminResponse && afterTicket.status === 'admin_replied' && 
          (!beforeTicket || !beforeTicket.adminResponse || beforeTicket.status !== 'admin_replied')) {
        respondedTicket = afterTicket;
        logger.info(`New admin response detected for ticket ${respondedTicket.id} for user ${userId}.`);
        break;
      }
    }

    if (respondedTicket) {
      const tokensSnapshot = await db.collection(`users/${userId}/fcmTokens`).get();
      if (tokensSnapshot.empty) {
        logger.info(`No FCM tokens found for user ${userId} to notify about ticket response.`);
        return null;
      }
      const tokens = tokensSnapshot.docs.map(doc => doc.id);

      const ticketTitlePreview = respondedTicket.text.length > 50 ? respondedTicket.text.substring(0, 47) + "..." : respondedTicket.text;

      const payload = {
        notification: {
          title: "Resposta do Suporte KinkLink 💬",
          body: `Sua solicitação sobre "${ticketTitlePreview}" foi respondida.`,
          icon: "/icons/kinklogo192.png",
        },
        data: {
          type: "ticket_response_notification",
          ticketId: respondedTicket.id,
          url: `/meus-tickets#ticket-${respondedTicket.id}`
        },
      };

      logger.info(`Sending ticket response notification to ${userId} with tokens: ${tokens.join(', ')}`, { payload });
      const response = await messaging.sendToDevice(tokens, payload);

      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          logger.error(`Failed to send ticket response notification to token ${tokens[index]} for user ${userId}:`, error.message);
          if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
            db.collection(`users/${userId}/fcmTokens`).doc(tokens[index]).delete().catch(deleteErr => logger.error(`Error deleting token ${tokens[index]}:`, deleteErr));
          }
        }
      });
    } else {
      logger.info("No new admin ticket response detected for user based on conditions.", { userId });
    }
    return null;
  }
);
