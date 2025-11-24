# Conectando Contas com seu Parceiro(a) (v4.0)

O KinkLink foi projetado para ser uma experiência compartilhada. Conectar sua conta com a do seu parceiro(a) é o que permite que vocês vejam os "Likes" um do outro, formem "Links" e conversem sobre as cartas.

**✨ Nova experiência v4.0:** Sistema de conexão simplificado e mais confiável, sem loops ou problemas de permissão!

## Acessando a Funcionalidade de Conexão (`LinkCouplePage`)

Você pode encontrar a opção para conectar contas geralmente na sua página de **Perfil**. Procure por um botão ou seção chamada "Conectar com Parceiro(a)", "Vincular Contas" ou similar.

## Como Funciona a Conexão?

O processo de conexão envolve duas etapas principais: um usuário gera um código de convite e o outro usuário o insere.

### 1. Gerando um Código de Convite (Usuário A - Iniciador)

Se você for o primeiro a iniciar a conexão:

1.  **Acesse a seção de conexão** no seu Perfil (geralmente um botão "Conectar com Parceiro(a)").
2.  **Clique em "Gerar Código"** na interface `CreateLink`.
3.  **Código Gerado Instantaneamente:** 
    - Um código único de **6 caracteres** (A-Z, 0-9) será exibido
    - O código é gerado com caracteres fáceis de ler (sem O, I, L que podem confundir)
    - **Seu vínculo é criado imediatamente** (em modo "pendente", aguardando seu parceiro)
4.  **Compartilhe o Código:** 
    - Copie o código (geralmente há um botão de copiar)
    - Envie para seu parceiro(a) através de mensagem, WhatsApp, etc.
    - **Importante:** Certifique-se de enviar o código correto!

**O que acontece nos bastidores:**
- Seu perfil é marcado com um `coupleId`
- Um "couple" é criado em modo pendente
- O código fica disponível para seu parceiro aceitar

### 2. Aceitando um Convite (Usuário B - Aceitante)

Se você recebeu um código do seu parceiro(a):

1.  **Acesse a seção de conexão** no seu Perfil.
2.  **Selecione "Inserir Código"** ou interface similar (`AcceptLink`).
3.  **Digite o Código:** 
    - Insira cuidadosamente os **6 caracteres** que seu parceiro compartilhou
    - O código não diferencia maiúsculas/minúsculas
    - Sem espaços ou caracteres especiais
4.  **Confirmar:** Clique em "Conectar" ou "Aceitar Convite".
5.  **Processamento:**
    - O sistema busca o código
    - Verifica se é válido e ainda não foi usado
    - Completa a conexão entre vocês dois

**Validações de Segurança:**
✅ Código deve ser válido  
✅ Você não pode aceitar seu próprio código  
✅ Você não pode estar já vinculado a outra pessoa  
✅ Código só pode ser usado uma vez  

**Mensagens de Erro Comuns:**
- "Código inválido ou expirado" → Código não existe
- "Você já está vinculado" → Precisa desvincular primeiro
- "Erro ao aceitar" → Tente novamente ou gere novo código

## Após a Conexão Bem-sucedida ✅

Suas contas estão vinculadas! Aqui está o que muda:

### Confirmações Visuais
*   **Mensagem de Sucesso:** Popup ou notificação confirmando a conexão
*   **Interface Atualizada:** Seção de conexão agora mostra status "Conectado"
*   **Informações do Parceiro:** Nome de usuário/email do parceiro visível no Perfil

### Funcionalidades Desbloqueadas
🔓 **Formação de Links:** Quando AMBOS curtirem a mesma carta → Link criado  
🔓 **Chat Compartilhado:** Acesso aos chats de todos os Links do casal  
🔓 **Pilha de Cartas:** Visualização completa com indicação de likes do parceiro  
🔓 **Lista de Links:** Ver todos os matches que vocês fizeram juntos  

### Símbolos de Identificação
Cada um de vocês recebe um símbolo único:
- **Iniciador (User A):** ★ (estrela)
- **Aceitante (User B):** ▲ (triângulo)

Esses símbolos aparecem nas interações para identificar quem fez cada ação.

## Desvinculando Contas 🔓

Se precisarem desvincular (ambos podem fazer isso):

### Processo
1.  **Acesse o Perfil** → Seção de conexão
2.  **Clique em "Desvincular"** ou "Desconectar Conta"
3.  **Confirmação:** 
    - O app pedirá confirmação (ação não pode ser desfeita facilmente)
    - Explica as consequências (perda de acesso a Links/chats)
4.  **Processamento:**
    - **Ambos os perfis** são atualizados (`coupleId` resetado para `null`)
    - O documento do couple é deletado
    - Links e chats do casal são mantidos no banco, mas inacessíveis

### Consequências ⚠️
❌ **Links não acessíveis:** Lista de matches fica indisponível  
❌ **Chats inacessíveis:** Conversas dos Links não podem mais ser abertas  
❌ **Novo vínculo necessário:** Para reconectar, precisam gerar novo código  
✅ **Dados preservados:** Histórico permanece no banco (pode ser recuperado em caso de reconexão manual)

### Reconexão
Para se conectarem novamente:
- Qualquer um pode gerar um novo código
- Seguir o processo normal de aceitação
- **Importante:** Isso cria um NOVO couple com novo ID

---

## Dicas e Solução de Problemas 🔧

### "Código não funciona"
- ✅ Verifique se digitou corretamente (6 caracteres)
- ✅ Código diferencia certas letras (sem O/I/L)
- ✅ Certifique-se que nenhum de vocês está já vinculado
- ✅ Gere um novo código se necessário

### "Já estou vinculado"
- Você precisa desvincular da pessoa atual primeiro
- Vá em Perfil → Desvincular

### "Parceiro não aparece após conexão"
- Feche e reabra o app
- Verifique conexão com internet
- Aguarde alguns segundos (sincronização Firestore)

---

A conexão de contas é o **coração da experiência KinkLink**. Com ela estabelecida, vocês estão prontos para explorar juntos!

A seguir, em "Personalizando sua Experiência com Skins", veremos como você pode dar um toque pessoal à aparência do aplicativo.
