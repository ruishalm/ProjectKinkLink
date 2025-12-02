/**
 * Import function triggers from their respective submodules.
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializa o Firebase Admin SDK para permitir que as funções acessem o Firestore e outros serviços.
admin.initializeApp();
logger.info("Firebase Admin SDK initialized. Project ID:", admin.app().options.projectId);

// Constantes de configuração. Considere movê-las para variáveis de ambiente.
const SITE_BASE_URL = "https://kinklink-a4607.web.app";
const DEFAULT_ICON_URL = `${SITE_BASE_URL}/icons/kinklogo192.png`;

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Função auxiliar que envia uma notificação push para um usuário específico via FCM.
 * Busca os tokens FCM do usuário, monta uma mensagem multi-plataforma e a envia.
 * Também realiza a limpeza de tokens inválidos ou expirados se o envio falhar.
 * @param {string} userId - O ID do usuário a ser notificado.
 * @param {string} title - O título da notificação.
 * @param {string} body - O corpo da notificação.
 * @param {admin.messaging.DataMessagePayload} [data={}] - Dados extras para enviar com a notificação.
 * @param {string} [iconUrl=DEFAULT_ICON_URL] - URL do ícone para notificações web.
 * @param {string} [targetUrlBase=SITE_BASE_URL] - URL base para o link da notificação.
 */
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
    notification: { title, body },
    tokens: tokens,
    data: data,
    webpush: {
      notification: {
        icon: iconUrl,
      },
      fcmOptions: {
        link: data?.url ? `${targetUrlBase}${data.url}` : targetUrlBase,
      },
    },
    android: {
      notification: {
        icon: "ic_stat_notification",
        color: "#b71c1c",
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: title,
            body: body,
          },
          badge: 1,
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    logger.info(
      `Successfully sent ${response.successCount} messages to user ${userId}. Failure count: ${response.failureCount}`
    );
    
    // Limpeza de tokens inválidos.
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          // Códigos de erro que indicam que o token não é mais válido.
          if (errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token') {
            const invalidToken = tokens[idx];
            logger.info(`Deleting invalid token: ${invalidToken} for user ${userId}`);
            db.collection("users").doc(userId).collection("fcmTokens").doc(invalidToken).delete()
              .catch(deleteErr => logger.error(`Error deleting token ${invalidToken} for user ${userId}:`, deleteErr));
          } else {
            logger.error(
              `Failed to send to token ${tokens[idx]} for user ${userId}: Code: ${errorCode}, Message: ${resp.error.message}`
            );
          }
        }
      });
    }
  } catch (error) {
    logger.error(`Error sending multicast message to user ${userId}:`, error);
  }
}

/**
 * Fetches a user's username from Firestore.
 * @param {string} userId The ID of the user.
 * @returns {Promise<string | null>} The username or null if not found or on error.
 */
async function getUsername(userId: string): Promise<string | null> {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      // Retorna o username se existir, caso contrário null.
      return userDoc.data()?.username || null;
    }
    logger.warn(`User document not found for ID: ${userId} in getUsername.`);
    return null;
  } catch (error) {
    logger.error(`Error fetching username for ${userId}:`, error);
    return null;
  }
}

/**
 * Notifica o primeiro usuário que curtiu uma carta (o "pioneiro") quando o 
 * segundo usuário (o "completador") também curte, formando um "match".
 * A notificação não é enviada ao usuário que completou o match, apenas ao que aguardava.
 */
export const onNewMatch = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "couples/{coupleId}/likedInteractions/{cardId}",
  },
  async (event) => {
    logger.info(
      `Match event triggered for couple ${event.params.coupleId}, card ${event.params.cardId}`,
      { eventId: event.id }
    );

    const beforeSnapshotData = event.data?.before.data();
    const afterSnapshotData = event.data?.after.data();

    // A condição para notificar é quando o estado de um card muda de "não-match" para "match".
    const wasNotMatchBefore = !event.data?.before.exists || beforeSnapshotData?.isMatch === false;
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

      const beforeLikedByUIDs = (beforeSnapshotData?.likedByUIDs as string[] | undefined) || [];

      // Determina quem foi o pioneiro (primeiro a curtir) e quem completou o match.
      // Isso é possível ao comparar a lista de UIDs antes e depois da atualização.
      if (beforeLikedByUIDs.length === 1 && likedByUIDs.length === 2) {
        pioneerUID = beforeLikedByUIDs[0];
        completadorUID = likedByUIDs.find(uid => uid !== pioneerUID);
      } else if (likedByUIDs.length === 2) {
        // Se o documento já foi criado com 2 UIDs, não é possível determinar o pioneiro.
        logger.warn("Match document created directly with two UIDs. Cannot determine pioneer for notification.", { likedByUIDs });
        return;
      }

      if (!pioneerUID || !completadorUID) {
        logger.error("Could not reliably determine pioneer or completador UID.", { beforeLikedByUIDs, likedByUIDs, pioneerUID, completadorUID });
        return;
      }

      logger.info(`Pioneer (to notify): ${pioneerUID}, Completador (triggered match): ${completadorUID}`);

      const completadorUsername = await getUsername(completadorUID);
      if (!completadorUsername) {
        logger.error(`Could not fetch username for completador ${completadorUID}. Aborting notification.`);
        return;
      }

      const cardData = afterSnapshotData.cardData as { text?: string; category?: string } | undefined;
      const cardCategoryForNotification = cardData?.category || "categoria desconhecida";

      const notificationTitle = "Novo Link! 🔗";
      const notificationBody = `Você e ${completadorUsername} têm um novo Link!🔗 numa carta de ${cardCategoryForNotification}.`;

      await sendNotificationToUser(
        pioneerUID,
        notificationTitle,
        notificationBody,
        {
          type: "match_notification",
          coupleId: event.params.coupleId,
          cardId: event.params.cardId,
          url: `/matches#card-${event.params.cardId}`
        }
      );
    } else {
      logger.info("Event did not meet criteria for a new match notification.", {
        afterDataExists: !!afterSnapshotData,
        isMatchNow,
        wasNotMatchBefore,
      });
    }
  }
);

/**
 * Envia uma sugestão de carta para re-engajamento dos casais.
 * Roda toda sexta-feira e seleciona aleatoriamente um dos matches existentes do casal
 * para sugerir uma conversa.
 */
export const sendWeeklyLinkSuggestion = onSchedule(
  {
    schedule: "0 16 * * 5", // Toda sexta-feira às 16:00
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async (event) => {
    logger.info("Executing sendWeeklyLinkSuggestion", { scheduleTime: event.scheduleTime, jobName: event.jobName });
    try {
      const couplesSnapshot = await db.collection("couples").get();
      if (couplesSnapshot.empty) {
        logger.info("No couples found. Exiting.");
        return;
      }

      for (const coupleDoc of couplesSnapshot.docs) {
        const coupleData = coupleDoc.data();
        const coupleId = coupleDoc.id;

        // Processa apenas casais ativos com dois membros.
        if (coupleData.members && coupleData.members.length === 2) {
          const memberUIDs = coupleData.members as string[];

          const likedInteractionsSnapshot = await db
            .collection("couples")
            .doc(coupleId)
            .collection("likedInteractions")
            .where("isMatch", "==", true)
            .get();

          if (likedInteractionsSnapshot.empty) {
            logger.info(`Couple ${coupleId} has no matched links. Skipping.`);
            continue;
          }

          // Seleciona uma carta aleatória da lista de matches do casal.
          const matchedCardsDocs = likedInteractionsSnapshot.docs;
          const randomIndex = Math.floor(Math.random() * matchedCardsDocs.length);
          const randomMatchDoc = matchedCardsDocs[randomIndex];
          const cardIdForNotification = randomMatchDoc.id;

          const notificationTitle = "KinkLink FDS 🎲";
          const notificationBody = "Sextou! Que tal esta sugestão para o fim de semana? 😉";
          const notificationData = {
            url: `/matches#card-${cardIdForNotification}`,
            type: "weekend_suggestion_notification",
            cardId: cardIdForNotification,
          };

          logger.info(`Selected card ${cardIdForNotification} for couple ${coupleId}. Sending to members: ${memberUIDs.join(", ")}`);

          for (const userId of memberUIDs) {
            try {
              await sendNotificationToUser(userId, notificationTitle, notificationBody, notificationData);
            } catch (error) {
              logger.error(`Failed to send weekly suggestion to user ${userId} in couple ${coupleId}`, error);
            }
          }
        } else {
          logger.info(`Couple ${coupleId} is not active (members count is not 2). Skipping.`);
        }
      }
      logger.info("sendWeeklyLinkSuggestion finished.");
    } catch (error) {
      logger.error("Error in sendWeeklyLinkSuggestion:", error);
    }
  }
);

/**
 * Notifica um usuário quando um de seus tickets de feedback recebe uma resposta do admin.
 * Acionada quando um documento na coleção 'tickets' é atualizado.
 */
export const onTicketUpdate = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "tickets/{ticketId}",
    cpu: 1,
    memory: "256MiB",
  },
  async (event) => {
    const ticketId = event.params.ticketId;
    logger.info(`Ticket document update event for ticket ${ticketId}. Checking for response.`);

    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    // Só processa se o documento foi atualizado (não criado ou deletado)
    if (!beforeSnapshot?.exists || !afterSnapshot?.exists) {
      logger.info("Ticket document created or deleted. Exiting response check.");
      return;
    }

    const beforeData = beforeSnapshot.data() as { adminResponse?: string; status: string; };
    const afterData = afterSnapshot.data() as { userId: string; id: string; adminResponse?: string; status: string; text: string; };

    if (!afterData || !afterData.userId) {
        logger.error("Update event, but after data is invalid or missing userId.", { ticketId });
        return;
    }

    // A condição para notificar é se uma resposta do admin foi adicionada.
    const hasNewResponse = afterData.adminResponse &&
                           afterData.status === 'admin_replied' &&
                           (!beforeData.adminResponse || beforeData.status !== 'admin_replied');

    if (hasNewResponse) {
      logger.info(`New admin response detected for ticket ${ticketId} for user ${afterData.userId}.`);

      const ticketTitlePreview = afterData.text.length > 50 ? afterData.text.substring(0, 47) + "..." : afterData.text;

      await sendNotificationToUser(
        afterData.userId,
        "Resposta do Suporte KinkLink 💬",
        `Sua solicitação sobre "${ticketTitlePreview}" foi respondida.`,
        {
          type: "ticket_response_notification",
          ticketId: afterData.id,
          url: `/meus-tickets#ticket-${afterData.id}`
        }
      );
    } else {
      logger.info("No new admin ticket response detected for ticket update.", { ticketId });
    }
  }
);

export const onLinkCompletedSendNotification = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "couples/{coupleId}",
  },
  async (event) => {
    const coupleId = event.params.coupleId;
    logger.info(`Couple document event for couple ${coupleId}. Checking for link completion.`);

    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!afterSnapshot?.exists) {
      logger.info(`Couple document ${coupleId} was deleted. No notification.`);
      return;
    }

    const beforeData = beforeSnapshot?.data();
    const afterData = afterSnapshot.data();

    // Notifica apenas quando um casal é formado (membros passa de <2 para 2).
    const membersBefore = (beforeData?.members as string[]) || [];
    const membersAfter = (afterData?.members as string[]) || [];
    const linkJustCompleted = membersAfter.length === 2 && membersBefore.length < 2;

    if (!linkJustCompleted) {
      logger.info(`Couple ${coupleId} update did not signify a new completed link.`);
      return;
    }

    const [user1Id, user2Id] = membersAfter;
    logger.info(`Link completed for couple ${coupleId}. Members: ${user1Id}, ${user2Id}. Sending notifications.`);

    const getUsername = async (userId: string): Promise<string> => {
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        return userDoc.data()?.username || "Seu par";
      } catch (error) {
        logger.error(`Error fetching username for ${userId}:`, error);
        return "Seu par";
      }
    };

    const [user1Name, user2Name] = await Promise.all([
      getUsername(user1Id),
      getUsername(user2Id),
    ]);

    // Envia notificação para ambos os usuários sobre a nova conexão.
    await Promise.all([
      sendNotificationToUser(
        user1Id, "Conexão Estabelecida! 🎉", `Você e ${user2Name} agora estão conectados no KinkLink!`,
        { url: "/matches", type: "link_completed", partnerId: user2Id }
      ),
      sendNotificationToUser(
        user2Id, "Conexão Estabelecida! 🎉", `Você e ${user1Name} agora estão conectados no KinkLink!`,
        { url: "/matches", type: "link_completed", partnerId: user1Id }
      ),
    ]);
  }
);

/**
 * Notifica o usuário parceiro quando uma nova mensagem é enviada no chat de uma carta.
 * Acionada na criação de um novo documento de mensagem.
 */
export const onNewChatMessage = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "couples/{coupleId}/cardChats/{cardId}/messages/{messageId}",
  },
  async (event) => {
    // Só aciona na criação de uma nova mensagem.
    if (!event.data?.after.exists || event.data.before.exists) {
      return;
    }

    const messageData = event.data.after.data();
    if (!messageData) {
      logger.info("No message data found.");
      return;
    }

    const { coupleId, cardId } = event.params;
    const senderId = messageData.userId;
    const messageText = messageData.text || "Nova mensagem";

    // Encontra o ID do destinatário no documento do casal.
    const coupleDoc = await db.doc(`couples/${coupleId}`).get();
    if (!coupleDoc.exists) {
      logger.error(`Couple document ${coupleId} not found.`);
      return;
    }
    const coupleData = coupleDoc.data();
    if (!coupleData?.members) {
      logger.error(`Couple data or members array is undefined for couple ${coupleId}.`);
      return;
    }
    const recipientId = (coupleData.members as string[]).find((id) => id !== senderId);

    if (!recipientId) {
      logger.error(`Recipient not found for message in couple ${coupleId}.`);
      return;
    }

    const senderUsername = await getUsername(senderId);
    if (!senderUsername) {
      logger.error(`Could not fetch username for sender ${senderId}. Aborting notification.`);
      return;
    }

    const notificationTitle = `Nova mensagem de ${senderUsername}`;
    const notificationBody = `"${messageText.substring(0, 80)}${messageText.length > 80 ? "..." : ""}"`;

    await sendNotificationToUser(
      recipientId,
      notificationTitle,
      notificationBody,
      {
        type: "chat_message",
        coupleId: coupleId,
        cardId: cardId,
        url: `/matches#card-${cardId}`,
      }
    );
  }
);

/**
 * Lógica de negócio para a notificação mensal de apoio.
 * Busca todos os usuários e dispara a notificação para cada um.
 */
async function enviarNotificacaoDeApoio() {
  logger.info("Iniciando envio da notificação mensal de apoio.");

  const usersSnapshot = await db.collection("users").get();
  if (usersSnapshot.empty) {
    logger.info("Nenhum usuário encontrado para notificar.");
    return;
  }

  const notificationTitle = "💖 Um convite do KinkLink!";
  const notificationBody = "Se você curte o app, que tal nos apoiar? Toque para saber mais!";
  const notificationData = {
    type: "support_notification",
    url: "/#openSupportModal",
  };

  for (const userDoc of usersSnapshot.docs) {
    try {
      await sendNotificationToUser(userDoc.id, notificationTitle, notificationBody, notificationData);
    } catch (error) {
      logger.error(`Falha ao enviar notificação de apoio para o usuário ${userDoc.id}`, error);
    }
  }
  logger.info(`Disparo de notificação de apoio concluído para ${usersSnapshot.size} usuários.`);
}

/**
 * Função agendada que dispara a notificação mensal de apoio todo dia 10.
 */
export const notificacaoMensalDeApoio = onSchedule(
  {
    schedule: "0 16 10 * *", // Todo dia 10 do mês, às 16:00.
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async (event) => {
    logger.info("Executando a notificação mensal de apoio agendada.", { scheduleTime: event.scheduleTime });
    await enviarNotificacaoDeApoio();
  }
);
