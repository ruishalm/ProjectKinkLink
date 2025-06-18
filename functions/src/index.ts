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

const SITE_BASE_URL = "https://kinklink-a4607.firebaseapp.com"; //  <<< VERIFIQUE E USE SEU DOMÍNIO CORRETO AQUI
const DEFAULT_ICON_URL = `${SITE_BASE_URL}/icons/kinklogo192.png`; //  <<< VERIFIQUE SE ESTE CAMINHO ESTÁ CORRETO

const db = admin.firestore();
const messaging = admin.messaging();

// Função auxiliar para enviar notificação para um usuário específico
async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data: admin.messaging.DataMessagePayload = {},
  iconUrl: string = DEFAULT_ICON_URL,
  targetUrlBase: string = SITE_BASE_URL
) {
  logger.info(`Attempting to send notification to user ${userId}`, { title, body, data });
  const tokensSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("fcmTokens")
    .get();

  if (tokensSnapshot.empty) {
    logger.info(`No FCM tokens found for user ${userId}.`);
    return;
  }

  const tokens: string[] = tokensSnapshot.docs.map(doc => doc.id);

  if (tokens.length === 0) {
    logger.info(`Tokens array is empty for user ${userId} after processing snapshot.`);
    return;
  }

  const message: admin.messaging.MulticastMessage = {
    notification: { title, body }, // Ícone é configurado por plataforma abaixo
    tokens: tokens,
    data: data,
    webpush: {
      notification: {
        icon: iconUrl, // Ícone para Web Push
      },
      fcmOptions: {
        link: data?.url ? `${targetUrlBase}${data.url}` : targetUrlBase,
      },
    },
    android: {
      notification: {
        icon: "ic_stat_notification", // Nome do ícone no drawable do Android
        color: "#b71c1c",
      },
    },
    apns: { // Configuração para iOS
      payload: {
        aps: {
          badge: 1, // Ou gerencie dinamicamente
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await messaging.sendMulticast(message);
    logger.info(
      `Successfully sent ${response.successCount} messages to user ${userId}. Failure count: ${response.failureCount}`
    );
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          // CORREÇÃO: Verificar se resp.error existe
          if (resp.error) {
            logger.error(
              `Failed to send to token ${tokens[idx]} for user ${userId}: Code: ${resp.error.code}, Message: ${resp.error.message}`
            );
            if (resp.error.code === 'messaging/registration-token-not-registered' ||
                resp.error.code === 'messaging/invalid-registration-token') {
              logger.info(`Deleting invalid token: ${tokens[idx]} for user ${userId}`);
              db.collection("users").doc(userId).collection("fcmTokens").doc(tokens[idx]).delete()
                .catch(deleteErr => logger.error(`Error deleting token ${tokens[idx]} for user ${userId}:`, deleteErr));
            }
          } else {
            // Caso resp.error seja undefined, mas resp.success é false
            logger.error(`Failed to send to token ${tokens[idx]} for user ${userId} with an unknown error. Response:`, resp);
          }
        }
      });
    }
  } catch (error) {
    logger.error(`Error sending multicast message to user ${userId}:`, error);
  }
}

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

      // Não precisamos buscar tokens aqui, sendNotificationToUser fará isso.

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

      // Usar a função sendNotificationToUser
      await sendNotificationToUser(
        pioneerUID,
        "É um Match! ❤️",
        `Você e ${completadorUsername} deram match no card "${cardTitle}". Confira!`,
        { // data payload
          type: "match_notification",
          coupleId: event.params.coupleId,
          cardId: event.params.cardId,
          url: `/matches#card-${event.params.cardId}`
        }
        // iconUrl e targetUrlBase usarão os padrões definidos em sendNotificationToUser
      );
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
      if (afterTicket.adminResponse && afterTicket.status === 'admin_replied' &&
          (!beforeTicket || !beforeTicket.adminResponse || beforeTicket.status !== 'admin_replied')) {
        respondedTicket = afterTicket;
        logger.info(`New admin response detected for ticket ${respondedTicket.id} for user ${userId}.`);
        break;
      }
    }

    if (respondedTicket) {
      // Não precisamos buscar tokens aqui, sendNotificationToUser fará isso.
      // A verificação de tokens vazios também é feita em sendNotificationToUser.

      const ticketTitlePreview = respondedTicket.text.length > 50 ? respondedTicket.text.substring(0, 47) + "..." : respondedTicket.text;

      await sendNotificationToUser(
        userId,
        "Resposta do Suporte KinkLink 💬",
        `Sua solicitação sobre "${ticketTitlePreview}" foi respondida.`,
        { // data payload
          type: "ticket_response_notification",
          ticketId: respondedTicket.id,
          url: `/meus-tickets#ticket-${respondedTicket.id}`
        }
      );
    } else {
      logger.info("No new admin ticket response detected for user based on conditions.", { userId });
    }
    return null;
  }
);

export const onLinkCompletedSendNotification = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "couples/{coupleId}",
  },
  async (event) => {
    const coupleId = event.params.coupleId;
    logger.info(`Couple document event for couple ${coupleId}. Checking for link completion.`, { eventId: event.id });

    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!afterSnapshot?.exists) {
      logger.info(`Couple document ${coupleId} was deleted or does not exist after update. No notification.`, { eventId: event.id });
      return null;
    }

    const beforeData = beforeSnapshot?.data();
    const afterData = afterSnapshot.data();

    if (!afterData) {
        logger.warn(`afterData is undefined for couple ${coupleId}, though snapshot exists. Exiting.`, { eventId: event.id });
        return null;
    }

    const membersBefore = (beforeData?.members as string[]) || [];
    const membersAfter = (afterData.members as string[]) || [];

    const linkJustCompleted =
      membersAfter.length === 2 &&
      (!beforeSnapshot?.exists || membersBefore.length < 2);

    if (!linkJustCompleted) {
      logger.info(
        `Couple ${coupleId} update did not signify a new completed link. Members before: ${membersBefore.length}, after: ${membersAfter.length}. Document existed before: ${beforeSnapshot?.exists}`,
        { eventId: event.id }
      );
      return null;
    }

    const [user1Id, user2Id] = membersAfter;

    logger.info(
      `Link completed for couple ${coupleId}. Members: ${user1Id}, ${user2Id}. Sending notifications.`,
      { eventId: event.id }
    );

    let user1Name = "Seu par";
    let user2Name = "Seu par";

    try {
      const user1Doc = await db.collection("users").doc(user1Id).get();
      if (user1Doc.exists) user1Name = user1Doc.data()?.username || user1Name;

      const user2Doc = await db.collection("users").doc(user2Id).get();
      if (user2Doc.exists) user2Name = user2Doc.data()?.username || user2Name;
    } catch (error) {
      logger.error(`Error fetching usernames for couple ${coupleId} notification:`, error, { eventId: event.id });
    }

    await sendNotificationToUser(
      user1Id,
      "Conexão Estabelecida! 🎉",
      `Você e ${user2Name} agora estão conectados no KinkLink!`,
      { url: "/matches", type: "link_completed", partnerId: user2Id }
    );

    await sendNotificationToUser(
      user2Id,
      "Conexão Estabelecida! 🎉",
      `Você e ${user1Name} agora estão conectados no KinkLink!`,
      { url: "/matches", type: "link_completed", partnerId: user1Id }
    );

    return null;
  }
);
