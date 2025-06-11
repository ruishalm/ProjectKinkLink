// d:\Projetos\Github\app\KinkLink\KinkLink\src\hooks\useCoupleLinking.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDocs,
  query,
  where,
  collection,
  writeBatch,
  serverTimestamp,
  addDoc,
  deleteDoc,
  onSnapshot,
  type Timestamp, // Import Timestamp type
} from 'firebase/firestore';

export interface LinkRequest {
  id: string; // ID do documento da solicitação
  requesterId: string;
  requesterEmail?: string; // Opcional, para exibição
  targetId: string;
  targetEmail?: string; // Opcional, para exibição ao solicitante
  status: 'pending' | 'accepted' | 'rejected'; // Status da solicitação
  createdAt: Timestamp;
}

export function useCoupleLinking() {
  const { user, updateUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<LinkRequest[]>([]);
  const [sentRequestStatus, setSentRequestStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(null);
  const [sentRequestTargetEmail, setSentRequestTargetEmail] = useState<string | null>(null);

  // Efeito para ouvir solicitações de vínculo direcionadas ao usuário atual
  useEffect(() => {
    if (!user || !user.id) {
      setIncomingRequests([]);
      setSentRequestStatus(null); // Limpa status da solicitação enviada se deslogar
      setSentRequestTargetEmail(null);
      return;
    }

    // Listener para solicitações recebidas
    const incomingRequestsRef = collection(db, 'linkRequests');
    const qIncoming = query(incomingRequestsRef, where('targetId', '==', user.id), where('status', '==', 'pending'));
    const unsubscribeIncoming = onSnapshot(qIncoming, (snapshot) => {
      const requests = snapshot.docs.map(docFound => ({ id: docFound.id, ...docFound.data() } as LinkRequest));
      setIncomingRequests(requests);
      console.log('[useCoupleLinking] Solicitações de vínculo recebidas atualizadas:', requests);
    }, (error) => {
      console.error("[useCoupleLinking] Erro ao ouvir solicitações de vínculo recebidas:", error);
      setIncomingRequests([]);
    });

    // Listener para verificar o status da solicitação enviada pelo usuário atual
    // (se o parceiro aceitou ou rejeitou)
    const sentRequestsRef = collection(db, 'linkRequests');
    const qSent = query(sentRequestsRef, where('requesterId', '==', user.id), where('status', '==', 'pending'));
    const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
        if (snapshot.empty) {
            // Se não há solicitações pendentes enviadas, verifica se alguma foi aceita/rejeitada recentemente
            // Isso é um pouco mais complexo, pois a request é deletada ao aceitar/rejeitar.
            // A atualização do `user.linkedPartnerId` pelo `AuthContext` é a principal forma de saber se foi vinculado.
            // Se o `user.linkedPartnerId` está preenchido e `sentRequestStatus` era 'pending', então foi aceita.
            if (user.linkedPartnerId && sentRequestStatus === 'pending') {
                console.log('[useCoupleLinking] Solicitação enviada parece ter sido aceita (usuário vinculado).');
                setSentRequestStatus('accepted'); // Target email remains to show who accepted
            } else if (sentRequestStatus === 'pending' && !user.linkedPartnerId) {
                // Se era pending e agora está vazia, e não foi vinculado, pode ter sido rejeitada ou cancelada.
                // Para simplificar, se não foi vinculado, resetamos.
                console.log('[useCoupleLinking] Solicitação enviada não está mais pendente e não houve vínculo (rejeitada/cancelada).');
                setSentRequestStatus(null); 
                setSentRequestTargetEmail(null);
            }
        } else {
            // Ainda há uma solicitação pendente enviada
            const sentReqData = snapshot.docs[0].data();
            setSentRequestStatus('pending');
            setSentRequestTargetEmail(sentReqData.targetEmail || sentReqData.targetId);
        }
    }, (error) => {
      console.error("[useCoupleLinking] Erro ao ouvir status da solicitação enviada:", error);
    });


    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
    };
  }, [user, sentRequestStatus]); // Adicionado sentRequestStatus para reavaliar se ele muda

  const requestLinkWithCode = async (codeToTry: string): Promise<boolean> => {
    if (!user || !user.id || user.linkedPartnerId || !codeToTry.trim()) {
      console.warn("[useCoupleLinking] Não é possível solicitar vínculo: sem usuário, usuário já vinculado ou código vazio.");
      return false;
    }

    const normalizedCode = codeToTry.toUpperCase();
    console.log(`[useCoupleLinking] Tentando solicitar vínculo com código: ${normalizedCode} pelo usuário ${user.email}`);

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('linkCode', '==', normalizedCode),
        where('linkedPartnerId', '==', null)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`[useCoupleLinking] Nenhum usuário encontrado com o código ${normalizedCode} ou o usuário já está vinculado.`);
        return false;
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetId = targetUserDoc.id;
      const targetData = targetUserDoc.data();

      if (targetId === user.id) {
        console.log("[useCoupleLinking] Usuário tentou enviar solicitação para si mesmo.");
        return false;
      }

      // Verifica se já existe uma solicitação pendente para este alvo
      const existingRequestQuery = query(collection(db, 'linkRequests'),
        where('requesterId', '==', user.id),
        where('targetId', '==', targetId),
        where('status', '==', 'pending'));
      const existingRequestSnap = await getDocs(existingRequestQuery);

      if (!existingRequestSnap.empty) {
        console.log(`[useCoupleLinking] Solicitação para ${targetData.email || targetId} já está pendente.`);
        setSentRequestStatus('pending');
        setSentRequestTargetEmail(targetData.email || targetId);
        return true;
      }

      await addDoc(collection(db, 'linkRequests'), {
        requesterId: user.id,
        requesterEmail: user.email,
        targetId: targetId,
        targetEmail: targetData.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log(`[useCoupleLinking] Solicitação de vínculo enviada para ${targetData.email || targetId}`);
      setSentRequestStatus('pending');
      setSentRequestTargetEmail(targetData.email || targetId);
      return true;

    } catch (error) {
      console.error("[useCoupleLinking] Erro ao enviar solicitação de vínculo:", error);
      setSentRequestStatus(null);
      setSentRequestTargetEmail(null);
      return false;
    }
  };

  const acceptLinkRequest = async (request: LinkRequest): Promise<boolean> => {
    if (!user || !user.id || user.id !== request.targetId || user.linkedPartnerId) {
      console.warn("[useCoupleLinking] Não é possível aceitar solicitação: usuário inválido, não é o alvo, ou já vinculado.");
      return false;
    }
    const { id: requestId, requesterId } = request;
    console.log(`[useCoupleLinking] Usuário ${user.id} aceitando solicitação ${requestId} de ${requesterId}`);

    try {
      const batch = writeBatch(db);

      // 1. Criar o documento do casal na coleção 'couples'
      const newCoupleRef = doc(collection(db, 'couples')); // Gera ID automático
      const newCoupleId = newCoupleRef.id;
      const coupleDocData = {
        members: [requesterId, user.id].sort(), // Ordena para consistência
        createdAt: serverTimestamp(),
      };
      batch.set(newCoupleRef, coupleDocData);

      // 2. Atualizar o documento do usuário atual (aceitante)
      const currentUserDocRef = doc(db, 'users', user.id);
      batch.update(currentUserDocRef, {
        linkedPartnerId: requesterId,
        coupleId: newCoupleId, // Adiciona o coupleId oficial
      });

      // 3. Atualizar o documento do solicitante
      const requesterUserDocRef = doc(db, 'users', requesterId);
      batch.update(requesterUserDocRef, {
        linkedPartnerId: user.id,
        coupleId: newCoupleId, // Adiciona o coupleId oficial
      });

      const requestDocRef = doc(db, 'linkRequests', requestId);
      batch.delete(requestDocRef); // Deleta a solicitação após aceitar

      await batch.commit();
      console.log(`[useCoupleLinking] Vínculo aceito e estabelecido entre ${user.id} e ${requesterId}.`);
      // O AuthContext (onSnapshot) deve pegar a atualização do linkedPartnerId.
      // A remoção da solicitação também será pega pelo listener de incomingRequests.
      // E o listener de sentRequest do parceiro também deve atualizar.
      // Explicitamente chamamos updateUser para garantir que o estado local reflita imediatamente.
      await updateUser({ linkedPartnerId: requesterId, coupleId: newCoupleId });
      setSentRequestStatus(null); // Limpa o status da solicitação enviada, pois agora está vinculado
      setSentRequestTargetEmail(null);
      return true;
    } catch (error) {
      console.error("[useCoupleLinking] Erro ao aceitar solicitação de vínculo:", error);
      return false;
    }
  };

  const rejectLinkRequest = async (requestId: string): Promise<boolean> => {
    if (!user || !user.id) return false;
    console.log(`[useCoupleLinking] Usuário ${user.id} rejeitando solicitação ${requestId}`);
    try {
      const requestDocRef = doc(db, 'linkRequests', requestId);
      await deleteDoc(requestDocRef);
      console.log(`[useCoupleLinking] Solicitação ${requestId} rejeitada e removida.`);
      return true;
    } catch (error) {
      console.error("[useCoupleLinking] Erro ao rejeitar solicitação de vínculo:", error);
      return false;
    }
  };

  const unlinkPartner = async (): Promise<void> => {
    if (!user || !user.id || !user.linkedPartnerId) {
      console.warn("[useCoupleLinking] Cannot unlink: no user or user not linked.");
      return;
    }
    const partnerIdToUnlink = user.linkedPartnerId;
    console.log(`[useCoupleLinking] Iniciando desvinculação entre ${user.id} e ${partnerIdToUnlink}`);
    try {
      const batch = writeBatch(db);
      const commonUpdates = {
        linkedPartnerId: null,
        matchedCards: [],
        seenCards: [],
        conexaoAccepted: 0,
        conexaoRejected: 0,
        userCreatedCards: [],
      };
      const currentUserDocRef = doc(db, 'users', user.id);
      batch.update(currentUserDocRef, commonUpdates);
      const partnerUserDocRef = doc(db, 'users', partnerIdToUnlink);
      batch.update(partnerUserDocRef, commonUpdates);
      await batch.commit();
      await updateUser(commonUpdates); // Atualiza o estado local do usuário atual
      setSentRequestStatus(null); // Limpa qualquer status de solicitação pendente
      setSentRequestTargetEmail(null);
      console.log(`[useCoupleLinking] ${user.email} desvinculado de ${partnerIdToUnlink}.`);
    } catch (error) {
      console.error("[useCoupleLinking] Erro ao desvincular parceiro:", error);
    }
  };

  // Função para cancelar uma solicitação enviada que ainda está pendente
  const cancelSentRequest = async (): Promise<boolean> => {
    if (!user || !user.id || sentRequestStatus !== 'pending') {
        console.warn("[useCoupleLinking] Nenhuma solicitação pendente para cancelar.");
        return false;
    }
    console.log(`[useCoupleLinking] Usuário ${user.id} cancelando solicitação enviada.`);
    try {
        const requestsRef = collection(db, 'linkRequests');
        const q = query(requestsRef, where('requesterId', '==', user.id), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const requestToCancel = snapshot.docs[0];
            await deleteDoc(doc(db, 'linkRequests', requestToCancel.id));
            console.log(`[useCoupleLinking] Solicitação ${requestToCancel.id} cancelada.`);
            setSentRequestStatus(null);
            setSentRequestTargetEmail(null);
            return true;
        }
        console.log("[useCoupleLinking] Nenhuma solicitação pendente encontrada para cancelar (pode já ter sido processada).");
        setSentRequestStatus(null); // Limpa de qualquer forma
        setSentRequestTargetEmail(null);
        return false;
    } catch (error) {
        console.error("[useCoupleLinking] Erro ao cancelar solicitação enviada:", error);
        return false;
    }
  };


  return {
    isLinked: !!user?.linkedPartnerId,
    linkedPartnerId: user?.linkedPartnerId,
    userLinkCode: user?.linkCode, // O código fixo do usuário
    requestLinkWithCode,
    unlinkPartner,
    incomingRequests,
    acceptLinkRequest,
    rejectLinkRequest,
    sentRequestStatus,
    sentRequestTargetEmail,
    cancelSentRequest,
  };
}
