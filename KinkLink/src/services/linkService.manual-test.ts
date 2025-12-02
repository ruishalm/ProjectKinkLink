/**
 * Script de teste manual para linkService
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Cole este código
 * 3. Rode: await testLinkingFlow()
 * 
 * ATENÇÃO: Isso vai criar dados reais no Firestore!
 */

import { createLink, acceptLink } from './linkService';
import { auth } from '../firebase';

export async function testLinkingFlow() {
  console.log('🧪 INICIANDO TESTE DO FLUXO DE LINKING');
  console.log('=======================================\n');

  if (!auth.currentUser) {
    console.error('❌ Você precisa estar logado para rodar este teste!');
    return;
  }

  const currentUserId = auth.currentUser.uid;
  console.log('👤 Usuário atual:', currentUserId);
  console.log('📧 Email:', auth.currentUser.email);
  console.log('');

  // PASSO 1: Criar link
  console.log('📝 PASSO 1: Criando link...');
  try {
    const linkCode = await createLink();
    console.log('✅ Link criado com sucesso!');
    console.log('🔑 Código:', linkCode);
    console.log('');
    console.log('🎯 PRÓXIMO PASSO:');
    console.log('   1. Abra uma aba anônima (Ctrl+Shift+N)');
    console.log('   2. Vá para: http://localhost:5173/accept-link');
    console.log('   3. Faça login com OUTRO usuário');
    console.log(`   4. Digite o código: ${linkCode}`);
    console.log('   5. Volte aqui e rode: await checkLinkStatus()');
    console.log('');
    
    // Salvar o código em uma variável global para facilitar
    (window as any).testLinkCode = linkCode;
    (window as any).testUserId = currentUserId;
    
    return linkCode;
  } catch (error) {
    console.error('❌ Erro ao criar link:', error);
    console.error('Detalhes:', (error as Error).message);
  }
}

export async function testAcceptLink(code: string) {
  console.log('🧪 TESTANDO ACEITAÇÃO DE LINK');
  console.log('==============================\n');

  if (!auth.currentUser) {
    console.error('❌ Você precisa estar logado para rodar este teste!');
    return;
  }

  const currentUserId = auth.currentUser.uid;
  console.log('👤 Usuário atual:', currentUserId);
  console.log('🔑 Código:', code);
  console.log('');

  console.log('📝 Tentando aceitar link...');
  try {
    const result = await acceptLink(code);
    console.log('✅ Link aceito com sucesso!');
    console.log('');
    console.log('📊 RESULTADO:');
    console.log('   Couple ID:', result.coupleId);
    console.log('   Partner ID:', result.partnerId);
    console.log('');
    console.log('🎉 VÍNCULO CRIADO COM SUCESSO!');
    console.log('');
    console.log('🔍 Verifique no Firestore:');
    console.log(`   - couples/${result.coupleId}`);
    console.log(`   - users/${currentUserId}`);
    console.log(`   - users/${result.partnerId}`);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao aceitar link:', error);
    console.error('Detalhes:', (error as Error).message);
    console.error('');
    console.log('💡 DICAS DE DEBUG:');
    console.log('   1. Verifique se as regras do Firestore estão publicadas');
    console.log('   2. Verifique se você não é o mesmo usuário que criou o link');
    console.log('   3. Verifique se o código está correto');
    console.log('   4. Verifique o console de erros do Firebase');
  }
}

// Instruções
console.log('');
console.log('🧪 TESTE MANUAL CARREGADO!');
console.log('==========================');
console.log('');
console.log('Para testar o fluxo completo:');
console.log('');
console.log('1️⃣  Rode: await testLinkingFlow()');
console.log('2️⃣  Copie o código gerado');
console.log('3️⃣  Abra aba anônima e aceite o link');
console.log('');
console.log('OU teste a aceitação diretamente:');
console.log('');
console.log('await testAcceptLink("SEU_CODIGO")');
console.log('');
