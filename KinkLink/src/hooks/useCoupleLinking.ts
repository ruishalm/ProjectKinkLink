import { useAuth } from '../contexts/AuthContext';

export function useCoupleLinking() {
  const { user, updateUser } = useAuth();

  const generateLinkCode = (): string | null => {
    if (!user) return null;
    // Gera um código simples de 6 caracteres alfanuméricos maiúsculos
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    updateUser({ linkCode: newCode, linkedPartnerId: null }); // Limpa o parceiro ao gerar novo código
    // console.log(`useCoupleLinking: Código gerado para ${user.email}: ${newCode}`);
    return newCode;
  };

  const attemptLinkWithCode = (code: string): boolean => {
    if (!user || user.linkedPartnerId) return false; // Não tenta se já vinculado ou sem usuário

    // Simulação - Em um cenário real, isso envolveria uma chamada de API/Firestore
    // para verificar o código e encontrar o parceiro.
    // Por agora, vamos usar um código fixo para simular o sucesso.
    if (code === 'PARTNER123') { // Código de simulação para o parceiro
      const partnerId = 'fictional-partner-id'; // ID simulado do parceiro
      updateUser({ linkedPartnerId: partnerId, linkCode: null }); // Vincula e limpa o código do usuário atual
      // console.log(`useCoupleLinking: ${user.email} vinculado com sucesso com ${partnerId} usando o código ${code}`);
      return true;
    }
    // console.log(`useCoupleLinking: Falha ao vincular ${user.email} com o código ${code}`);
    return false;
  };

  const unlinkPartner = () => {
    if (!user || !user.linkedPartnerId) return;
    // console.log(`useCoupleLinking: ${user.email} desvinculando de ${user.linkedPartnerId}`);
    updateUser({ linkedPartnerId: null, linkCode: null }); // Limpa o parceiro e o código
  };

  return {
    isLinked: !!user?.linkedPartnerId,
    linkedPartnerId: user?.linkedPartnerId,
    userLinkCode: user?.linkCode, // O código que o usuário atual gerou (se houver)
    generateLinkCode,
    attemptLinkWithCode,
    unlinkPartner,
  };
}
