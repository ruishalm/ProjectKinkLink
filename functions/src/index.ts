/**
 * Import function triggers from their respective submodules:
 *
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler"; // Import para funções agendadas
import {onCall, HttpsError} from "firebase-functions/v2/https"; // <<< ADICIONAR onCall e HttpsError
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();
// Log para verificar o ID do projeto que o Admin SDK está usando
logger.info("Firebase Admin SDK initialized. Project ID from default app:", admin.app().options.projectId);

const SITE_BASE_URL = "https://kinklink-a4607.web.app";
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

  // MENSAGEM MULTICAST ORIGINAL (MANTENHA PARA REFERÊNCIA OU COMENTE)
  // Você pode querer reintroduzir esta estrutura completa ou partes dela
  // agora que o envio simples funcionou.
  const originalMessage: admin.messaging.MulticastMessage = {
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

  // MENSAGEM MULTICAST SIMPLIFICADA PARA TESTE (USADA ANTERIORMENTE)
  /*
  const simplifiedMulticastMessage: admin.messaging.MulticastMessage = {
    notification: { title, body },
    tokens: tokens,
    // Remova data, webpush, android, apns para este teste
  };
  */

  // logger.info("[MULTICAST TEST] Using simplified message structure for user:", userId);
  logger.info("Using original message structure for user:", userId);


  try {
    // Alterado de sendMulticast para sendEachForMulticast
    const response = await messaging.sendEachForMulticast(originalMessage); // Usando a mensagem original agora
    logger.info(
      `Successfully sent ${response.successCount} messages to user ${userId}. Failure count: ${response.failureCount}`
    );
    if (response.failureCount > 0) {
      // Adicionando tipo explícito para resp e idx
      response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
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

      // Acessar likedByUIDs do beforeData, não do beforeSnapshotData diretamente
      const beforeLikedByUIDs = (beforeSnapshotData?.likedByUIDs as string[] | undefined) || [];

      // Lógica para determinar quem deu o like primeiro e quem completou o match
      // Isso funciona quando o documento é atualizado de 1 para 2 UIDs.
      // O 'pioneiro' é quem já estava lá. O 'completador' é o novo UID.

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

      // BLOCO DE TESTE TEMPORÁRIO PARA ENVIO SIMPLES (REMOVIDO POIS O ENVIO SIMPLES FUNCIONOU)
      // if (pioneerUID) {
      //   try {
      //     const testToken = "dS5kqNX20kzulHFTMDVU3Q:APA91bHuO93tTx9dYuf71M083L55UivnQC7tqCvcNcwPZ6-YQpDjDse15pb4NNjrwbf-L8eCyccyjVmyQjBPGlO8S7Br_XEMt3FXXpZBGVI2NHj4InlsIsM";
      //     if (testToken.length > 50) {
      //       logger.info(`[TESTE SIMPLES] Attempting to send a simple test notification to token: ${testToken.substring(0, 20)}...`);
      //       const testResponse = await messaging.send({
      //         notification: {
      //           title: "KinkLink Teste Simples",
      //           body: "Esta é uma mensagem de teste da Cloud Function (envio simples)."
      //         },
      //         token: testToken
      //       });
      //       logger.info(`[TESTE SIMPLES] Simple test notification sent successfully:`, testResponse);
      //     } else {
      //       logger.warn("[TESTE SIMPLES] Token de teste parece inválido (muito curto). Pulando envio simples.");
      //     }
      //   } catch (testError) {
      //     logger.error(`[TESTE SIMPLES] Error sending simple test notification:`, testError);
      //   }
      // }
      // FIM DO BLOCO DE TESTE TEMPORÁRIO

      let completadorUsername = "Alguém";
      try {
        const completadorDoc = await db.doc(`users/${completadorUID}`).get();
        if (completadorDoc.exists) {
          completadorUsername = completadorDoc.data()?.username || "Alguém";
        }
      } catch (error) {
        logger.error(`Error fetching completador's (${completadorUID}) username:`, error);
      }

      // Garantir que temos a categoria do card para a nova mensagem
      const cardData = afterSnapshotData.cardData as { text?: string; category?: string } | undefined;
      let cardCategoryForNotification = "categoria desconhecida"; // Fallback
      if (cardData?.category) {
        cardCategoryForNotification = cardData.category;
      } else if (cardData?.text) {
        // Se não houver categoria, mas houver texto, podemos usar um placeholder ou omitir
        // Por enquanto, manteremos o fallback "categoria desconhecida" se category não estiver presente.
        // Ou você pode decidir usar o cardData.text aqui de alguma forma.
        // Exemplo: cardCategoryForNotification = `descrita como "${cardData.text.substring(0,20)}..."`;
      }

      const notificationTitle = "Novo Link! 🔗";
      const notificationBody = `Você e ${completadorUsername} têm um novo Link!🔗 numa carta de ${cardCategoryForNotification}.`;

      // Usar a função sendNotificationToUser
      await sendNotificationToUser(
        pioneerUID,
        notificationTitle,
        notificationBody,
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
  }
);

/**
 * Cloud Function agendada para enviar uma sugestão de link para casais
 * toda sexta-feira às 16h.
 */
export const sendWeeklyLinkSuggestion = onSchedule(
  {
    schedule: "0 16 * * 5", // Toda sexta-feira às 16:00
    timeZone: "America/Sao_Paulo", // Fuso horário de São Paulo
    region: "southamerica-east1", // Manter a mesma região das outras funções
    // memory: "512MiB", // Opcional: Aumentar memória se houver muitos casais
  },
  async (event) => {
    // Tentativa de correção para event.id e event.time:
    // O objeto 'event' para onSchedule pode não ter 'id' e 'time' diretamente.
    // O 'jobName' pode ser um identificador útil, e o timestamp da execução pode ser obtido de outras formas se necessário,
    // ou simplesmente logar o evento inteiro para inspeção.
    // Por agora, vamos logar o que é garantido existir ou o evento completo.
    logger.info("Executing sendWeeklyLinkSuggestion", { scheduleTime: event.scheduleTime, jobName: event.jobName, eventDetails: event });
    try {
      const couplesSnapshot = await db.collection("couples").get();
      if (couplesSnapshot.empty) {
        logger.info("No couples found. Exiting sendWeeklyLinkSuggestion.");
        return;
      }

      let notificationsAttempted = 0;

      for (const coupleDoc of couplesSnapshot.docs) {
        const coupleData = coupleDoc.data();
        const coupleId = coupleDoc.id;

        // Verifica se o casal tem dois membros (está ativo)
        if (coupleData.members && coupleData.members.length === 2) {
          const memberUIDs = coupleData.members as string[];

          // Busca os "links" (matches) para este casal
          const likedInteractionsSnapshot = await db
            .collection("couples")
            .doc(coupleId)
            .collection("likedInteractions")
            .where("isMatch", "==", true)
            .get();

          if (likedInteractionsSnapshot.empty) {
            logger.info(`Couple ${coupleId} has no matched links. Skipping.`);
            continue; // Pula para o próximo casal
          }

          // Seleciona uma carta aleatória da lista de matches
          const matchedCardsDocs = likedInteractionsSnapshot.docs;
          const randomIndex = Math.floor(Math.random() * matchedCardsDocs.length);
          const randomMatchDoc = matchedCardsDocs[randomIndex];
          // const randomMatchData = randomMatchDoc.data(); // Descomente se precisar de cardData.text, etc.
          const cardIdForNotification = randomMatchDoc.id;

          const notificationTitle = "KinkLink FDS 🎲";
          const notificationBody = "Sextou! Que tal esta sugestão para o fim de semana? 😉";
          const notificationData = {
            url: `/matches#card-${cardIdForNotification}`, // URL para abrir o chat da carta específica
            type: "weekend_suggestion_notification", // Tipo para identificação no cliente, se necessário
            cardId: cardIdForNotification,
          };

          logger.info(`Selected card ${cardIdForNotification} for couple ${coupleId}. Sending to members: ${memberUIDs.join(", ")}`);

          for (const userId of memberUIDs) {
            await sendNotificationToUser(userId, notificationTitle, notificationBody, notificationData);
            notificationsAttempted++;
          }
        } else {
          logger.info(`Couple ${coupleId} does not have 2 members or 'members' field is missing. Skipping.`);
        }
      }
      logger.info(`sendWeeklyLinkSuggestion finished. Total notifications attempted: ${notificationsAttempted}`);
    } catch (error) {
      logger.error("Error in sendWeeklyLinkSuggestion:", error);
    }
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
      return;
    }

    const beforeData = beforeSnapshot.data();
    const afterData = afterSnapshot.data();

    if (!beforeData || !afterData) {
      logger.info("beforeData or afterData is undefined. Exiting ticket response check.", { userId, eventId: event.id });
      return;
    }

    if (!afterData.feedbackTickets) {
      logger.info("No feedbackTickets in afterData. Exiting.", { userId });
      return; // Retorna void
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
      return;
    }

    const beforeData = beforeSnapshot?.data();
    const afterData = afterSnapshot.data();

    if (!afterData) {
        logger.warn(`afterData is undefined for couple ${coupleId}, though snapshot exists. Exiting.`, { eventId: event.id });
        return;
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
      return; // Retorna void
    }

    const [user1Id, user2Id] = membersAfter;

    logger.info(
      `Link completed for couple ${coupleId}. Members: ${user1Id}, ${user2Id}. Sending notifications.`,
      { eventId: event.id }
    );

    // Função auxiliar para buscar o nome do usuário de forma segura
    const getUsername = async (userId: string): Promise<string> => {
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          return userDoc.data()?.username || "Seu par";
        }
      } catch (error) {
        logger.error(`Error fetching username for ${userId}:`, error);
      }
      return "Seu par";
    };

    // Busca os nomes dos usuários em paralelo
    const [user1Name, user2Name] = await Promise.all([
      getUsername(user1Id),
      getUsername(user2Id),
    ]);

    // Envia notificação para ambos os usuários
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
 * Cloud Function para notificar um usuário quando uma nova mensagem de chat é enviada.
 * Acionada quando um documento é criado em 'couples/{coupleId}/cardChats/{cardId}/messages/{messageId}'.
 */
export const onNewChatMessage = onDocumentWritten(
  {
    region: "southamerica-east1",
    document: "couples/{coupleId}/cardChats/{cardId}/messages/{messageId}",
  },
  async (event) => {
    // Só aciona na criação de uma nova mensagem
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

    // Busca o documento do casal para encontrar o destinatário
    const coupleDoc = await db.doc(`couples/${coupleId}`).get();
    if (!coupleDoc.exists) {
      logger.error(`Couple document ${coupleId} not found.`);
      return;
    }

    const coupleData = coupleDoc.data();
    if (!coupleData || !Array.isArray(coupleData.members)) {
      logger.error(`Couple data or members array is undefined for couple ${coupleId}.`);
      return;
    }
    const members = coupleData.members as string[];
    const recipientId = members.find((id) => id !== senderId);

    if (!recipientId) {
      logger.error(`Recipient not found for message in couple ${coupleId}.`);
      return;
    }

    // Busca o nome de usuário do remetente para uma notificação mais amigável
    let senderUsername = "Seu par";
    try {
      const senderDoc = await db.doc(`users/${senderId}`).get();
      if (senderDoc.exists) {
        senderUsername = senderDoc.data()?.username || "Seu par";
      }
    } catch (error) {
      logger.error("Error fetching sender's username:", error);
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
 * Lógica para enviar a notificação mensal de apoio.
 * Busca todos os usuários e envia a notificação para cada um.
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
    url: "/#openSupportModal", // URL para o frontend identificar e abrir o modal
  };

  for (const userDoc of usersSnapshot.docs) {
    await sendNotificationToUser(userDoc.id, notificationTitle, notificationBody, notificationData);
  }
  logger.info(`Notificação de apoio enviada para ${usersSnapshot.size} usuários.`);
}

/**
 * Cloud Function agendada para rodar todo dia 10 do mês às 16:00.
 * Envia uma notificação convidando os usuários a apoiarem o projeto.
 */
export const notificacaoMensalDeApoio = onSchedule(
  {
    schedule: "0 16 10 * *",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async (event) => {
    logger.info("Executando a notificação mensal de apoio agendada.", { scheduleTime: event.scheduleTime });
    await enviarNotificacaoDeApoio().catch((error) => {
      logger.error("Erro ao executar a notificação mensal de apoio:", error);
    });
  }
);

/**
 * Função chamável para aceitar um código de vínculo.
 * Executa a vinculação de forma atômica e segura no backend.
 */
export const acceptLinkCallable = onCall({ region: "southamerica-east1" }, async (request) => {
  // 1. Verifica se o usuário está autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "A função deve ser chamada por um usuário autenticado.");
  }

  const linkCodeToAccept = request.data.linkCode;
  if (!linkCodeToAccept || typeof linkCodeToAccept !== 'string') {
    throw new HttpsError("invalid-argument", "O código do link ('linkCode') é inválido ou não foi fornecido.");
  }

  const currentUserB_uid = request.auth.uid;
  const pendingLinkRef = db.collection('pendingLinks').doc(linkCodeToAccept);

  try {
    const result = await db.runTransaction(async (transaction) => {
      // 2. Lê o link pendente
      const pendingLinkSnap = await transaction.get(pendingLinkRef);
      if (!pendingLinkSnap.exists) {
        throw new HttpsError("not-found", "Código de vínculo inválido ou não encontrado.");
      }
      const pendingLinkData = pendingLinkSnap.data();

      // Verificação de segurança adicional
      if (!pendingLinkData || !pendingLinkData.initiatorUserId) {
        throw new HttpsError("data-loss", "Os dados do código de vínculo estão corrompidos ou incompletos.");
      }

      if (pendingLinkData?.status !== 'pending') {
        throw new HttpsError("failed-precondition", "Este código de vínculo já foi usado, expirou ou foi cancelado.");
      }

      const initiatorUserIdA = pendingLinkData.initiatorUserId;

      if (initiatorUserIdA === currentUserB_uid) {
        throw new HttpsError("failed-precondition", "Você não pode se vincular consigo mesmo.");
      }

      // 3. Lê os documentos dos dois usuários
      const userARef = db.collection('users').doc(initiatorUserIdA);
      const userBRef = db.collection('users').doc(currentUserB_uid);
      const [userASnap, userBSnap] = await transaction.getAll(userARef, userBRef);

      if (!userASnap.exists) {
        transaction.update(pendingLinkRef, { status: 'expired' });
        throw new HttpsError("not-found", "O usuário que criou o código não foi encontrado.");
      }
      if (!userBSnap.exists) {
        throw new HttpsError("not-found", "Seus dados de usuário não foram encontrados.");
      }

      const userDataA = userASnap.data();
      const userDataB = userBSnap.data();

      if (userDataA?.coupleId || userDataA?.partnerId) {
        transaction.update(pendingLinkRef, { status: 'cancelled_initiator_linked' });
        throw new HttpsError("failed-precondition", "O usuário que criou o código já está vinculado a outra pessoa.");
      }
      if (userDataB?.coupleId || userDataB?.partnerId) {
        throw new HttpsError("failed-precondition", "Você já está vinculado a outra pessoa. Desvincule primeiro.");
      }

      // 4. Todos os cheques passaram, realizar a vinculação
      const newCoupleRef = db.collection('couples').doc();
      const newCoupleId = newCoupleRef.id;

      const coupleDocData = {
        members: [initiatorUserIdA, currentUserB_uid].sort(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberSymbols: {
          [initiatorUserIdA]: '★',
          [currentUserB_uid]: '▲',
        },
      };
      transaction.set(newCoupleRef, coupleDocData);

      // Atualiza os dois usuários
      transaction.update(userARef, { partnerId: currentUserB_uid, coupleId: newCoupleId });
      transaction.update(userBRef, { partnerId: initiatorUserIdA, coupleId: newCoupleId });

      // Deleta o link pendente
      transaction.delete(pendingLinkRef);

      return { coupleId: newCoupleId, partnerId: initiatorUserIdA };
    });

    logger.info(`Vínculo com código ${linkCodeToAccept} aceito com sucesso por ${currentUserB_uid}! Couple ID: ${result.coupleId}`);
    return { success: true, coupleId: result.coupleId, partnerId: result.partnerId };

  } catch (error) {
    logger.error(`Erro ao aceitar código de vínculo ${linkCodeToAccept} via callable function:`, error);
    // Se o erro já for um HttpsError, relança. Senão, cria um erro genérico.
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Ocorreu um erro interno ao tentar criar o vínculo.", error);
  }
});
