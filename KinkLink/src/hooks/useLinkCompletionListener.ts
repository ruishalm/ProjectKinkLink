import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore'; // Type-only import
import type { User as AuthContextUser } from '../contexts/AuthContext'; // Importa o tipo User do seu AuthContext
import { db } from '../firebase'; // Ajustado para apontar para src/firebase.ts
import {
  completeLinkForInitiator,
  type PendingLinkData, // Import as type-only
} from '../services/linkService'; // Adjust path if your linkService is elsewhere

/**
 * Hook para ouvir por `pendingLinks` completados que foram iniciados pelo usuário atual.
 * Quando um link é completado, chama `completeLinkForInitiator`.
 *
 * @param currentUser O objeto do usuário autenticado do seu AuthContext.
 * @param isUserLinked Booleano indicando se o usuário já está vinculado.
 * @param onLinkCompleted Callback opcional para ser chamado quando o vínculo é completado no lado do iniciador.
 */
export const useLinkCompletionListener = (
  currentUser: AuthContextUser | null, // Alterado para aceitar o User do AuthContext
  isUserLinked: boolean,
  onLinkCompleted?: (coupleId: string, partnerId: string) => void
) => {
  const [processingLinkId, setProcessingLinkId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined = undefined;

    // Ensure currentUser has a uid property
    const currentUserId = currentUser?.id; // Alterado para usar 'id' do AuthContextUser

    if (currentUserId && !isUserLinked && !processingLinkId) {
      console.log(`[Listener Usuário A ${currentUserId}]: Iniciando escuta por links completados.`);
      const q = query(
        collection(db, 'pendingLinks'),
        where('initiatorUserId', '==', currentUserId),
        where('status', '==', 'completed')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const completedLink = {
                ...(change.doc.data() as Omit<PendingLinkData, 'linkCode'>),
                linkCode: change.doc.id,
              } as PendingLinkData;

              if (completedLink.linkCode === processingLinkId) {
                console.log(`[Listener Usuário A ${currentUserId}]: Link ${completedLink.linkCode} já está sendo processado.`);
                return;
              }

              const userDocRef = doc(db, 'users', currentUserId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists() && (userDocSnap.data().coupleId || userDocSnap.data().partnerId)) {
                console.log(`[Listener Usuário A ${currentUserId}]: Usuário já vinculado (verificação interna do listener), ignorando link ${completedLink.linkCode}.`);
                return;
              }

              if (completedLink.acceptedBy && completedLink.coupleId) {
                console.log(
                  `[Listener Usuário A ${currentUserId}]: Link ${completedLink.linkCode} completado por ${completedLink.acceptedBy} detectado!`
                );
                setProcessingLinkId(completedLink.linkCode);

                try {
                  await completeLinkForInitiator(completedLink);
                  console.log(
                    `[Listener Usuário A ${currentUserId}]: Vínculo com ${completedLink.acceptedBy} (Couple ID: ${completedLink.coupleId}) finalizado com sucesso.`
                  );
                  if (onLinkCompleted && completedLink.coupleId && completedLink.acceptedBy) {
                    onLinkCompleted(completedLink.coupleId, completedLink.acceptedBy);
                  }
                } catch (error) {
                  console.error(
                    `[Listener Usuário A ${currentUserId}]: Erro ao tentar completar o vínculo para o link ${completedLink.linkCode}:`,
                    error
                  );
                } finally {
                  setProcessingLinkId(null);
                }
              }
            }
          });
        },
        (error) => {
          console.error(`[Listener Usuário A ${currentUserId}]: Erro no listener de pendingLinks:`, error);
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, isUserLinked, onLinkCompleted, processingLinkId]);
};