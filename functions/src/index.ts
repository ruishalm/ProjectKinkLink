// d:\Projetos\Github\app\KinkLink\functions\src\index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin SDK (apenas uma vez no escopo global do arquivo)
admin.initializeApp();
const db = admin.firestore();

// Define a interface para os dados esperados do cliente ao chamar a função
interface AcceptLinkRequestData {
  requestId: string;
}

// Define a interface para os dados da solicitação de vínculo como estão no Firestore
interface LinkRequestDocument {
  requesterId: string;
  targetId: string;
  status: string;
  // Adicione outros campos se existirem na sua solicitação, como requesterEmail, targetEmail
}

// Define a interface para os dados do perfil do usuário no Firestore
interface UserProfileDocument {
  linkedPartnerId?: string | null;
  // Adicione outros campos relevantes do perfil se precisar lê-los na função
} // Adicionado o fechamento da interface aqui

export const acceptLinkRequestFunction = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // 1. Autenticação e Autorização
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "A função deve ser chamada por um usuário autenticado."
      );
    }
    // Faz o cast dos dados para a interface esperada
    const requestData = data as AcceptLinkRequestData;

    const userId = context.auth.uid;
    const requestId = requestData.requestId; // Usa requestData.requestId

    if (!requestId || typeof requestId !== "string") { // Verifica requestId de requestData
      throw new functions.https.HttpsError(
        "invalid-argument",
        "O ID da solicitação (requestId) é obrigatório e deve ser uma string."
      );
    }

    functions.logger.info(`Usuário ${userId} tentando aceitar solicitação ${requestId}`);

    try {
      // 2. Ler a solicitação e validar
      const requestDocRef = db.collection("linkRequests").doc(requestId);
      const requestDocSnap = await requestDocRef.get();

      if (!requestDocSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Solicitação de vínculo não encontrada."
        );
      }

      const linkRequest = requestDocSnap.data() as LinkRequestDocument;
      functions.logger.info(`Dados da solicitação ${requestId}:`, linkRequest);

      if (linkRequest.targetId !== userId) {
        functions.logger.error(
          `Permissão negada: Usuário ${userId} não é o alvo da solicitação ${requestId}. Alvo real: ${linkRequest.targetId}`);
        throw new functions.https.HttpsError(
          "permission-denied",
          "Você não tem permissão para aceitar esta solicitação."
        );
      }

      if (linkRequest.status !== "pending") {
        functions.logger.warn(
          `Solicitação ${requestId} não está pendente. Status atual: ${linkRequest.status}. Removendo solicitação.`
        );
        // Se não estiver pendente, pode já ter sido processada.
        // Deletar a solicitação é uma ação segura para limpar.
        await requestDocRef.delete();
        return {success: true, message: "Solicitação já processada ou não estava pendente."};
      }
      // Verificar se o usuário alvo (quem está aceitando) já está vinculado
      const targetUserDocRef = db.collection("users").doc(userId);
      const targetUserSnap = await targetUserDocRef.get();
      const targetUserData = targetUserSnap.data() as UserProfileDocument | undefined;

      if (targetUserData?.linkedPartnerId) {
        functions.logger.warn(
          `Usuário ${userId} (alvo) já está vinculado a ${targetUserData.linkedPartnerId}. Removendo solicitação ${requestId}.`
        );
        await requestDocRef.delete(); // Limpa a solicitação pendente
        return {
          success: false,
          message: "Você já está vinculado a outro usuário.",
        };
      }

      // Verificar se o usuário solicitante já está vinculado
      const requesterUserDocRef = db.collection("users").doc(linkRequest.requesterId);
      const requesterUserSnap = await requesterUserDocRef.get();
      const requesterUserData = requesterUserSnap.data() as UserProfileDocument | undefined;

      if (requesterUserData?.linkedPartnerId) {
        functions.logger.warn(
          `Usuário ${linkRequest.requesterId} (solicitante) já está vinculado a ${requesterUserData.linkedPartnerId}. Removendo solicitação ${requestId}.`
        );
        await requestDocRef.delete(); // Limpa a solicitação pendente
        return {
          success: false,
          message: "O usuário solicitante já está vinculado a outro.",
        };
      }

      // 3. Operação Atômica no Firestore
      const batch = db.batch();

      batch.update(targetUserDocRef, { // Atualiza o usuário que aceitou (alvo)
        linkedPartnerId: linkRequest.requesterId,
      });

      batch.update(requesterUserDocRef, { // Atualiza o usuário que solicitou
        linkedPartnerId: userId,
      });

      batch.delete(requestDocRef); // Deleta a solicitação de vínculo

      await batch.commit();

      functions.logger.info(
        `Vínculo estabelecido entre ${userId} (alvo) e ${linkRequest.requesterId} (solicitante). Solicitação ${requestId} deletada.`
      );
      return {success: true, message: "Vínculo aceito com sucesso!"};
    } catch (error: any) {
      functions.logger.error(`Erro ao aceitar solicitação de vínculo ${requestId} para usuário ${userId}:`, error);
      if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsError para o cliente
      }
      // Para outros erros, logue e retorne um erro genérico
      let message = "Ocorreu um erro interno ao processar sua solicitação.";
      if (error.message) {
        message = error.message;
      }
      throw new functions.https.HttpsError("internal", message, error);
    }
  }
);

// Você pode adicionar outras Cloud Functions aqui no futuro
// export const outraFuncao = functions.https.onCall(async (data, context) => { ... });
