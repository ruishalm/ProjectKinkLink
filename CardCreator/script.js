document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const categoryButtons = document.querySelectorAll('.category-button');
    const cardPreview = document.getElementById('card-preview');
    const intensityInput = document.getElementById('intensity-input');
    const intensityDisplayBR = document.getElementById('intensity-display-br');
    const cardTextInput = document.getElementById('card-text-input');
    const createCardBtn = document.getElementById('create-card-btn');
    const generateJsonBtn = document.getElementById('generate-json-btn');
    const jsonOutput = document.getElementById('json-output');

    // Listas por categoria (MODIFICADO)
    const cardLists = {
        sensorial: document.getElementById('list-sensorial'),
        poder: document.getElementById('list-poder'),
        fantasia: document.getElementById('list-fantasia'),
        exposicao: document.getElementById('list-exposicao'),
        conexao: document.getElementById('list-conexao') // ADICIONADO
    };

    // Estado (MODIFICADO)
    let currentCategory = null;
    let createdCards = {
        sensorial: [],
        poder: [],
        fantasia: [],
        exposicao: [],
        conexao: [] // ADICIONADO
    };

    // Categorias válidas (para limpar classes no preview)
    const validCategories = ['sensorial', 'poder', 'fantasia', 'exposicao', 'conexao']; // ADICIONADO

    // --- Funções Auxiliares ---

    function updateCardPreviewColor() {
        validCategories.forEach(cat => cardPreview.classList.remove(cat));
        cardPreview.style.backgroundColor = '';
        if (currentCategory) {
            cardPreview.classList.add(currentCategory);
        }
    }

    function updateIntensityDisplay() {
        const value = intensityInput.value || '?';
        intensityDisplayBR.textContent = value;
    }

    function addCardToList(card) {
        const listElement = cardLists[card.category];
        if (listElement) {
            const listItem = document.createElement('li');
            // Para cartas 'conexao', a intensidade pode não fazer sentido, mas mantemos por consistência da estrutura
            listItem.textContent = `[${card.intensity || '?'}] ${card.text}`;
            listItem.classList.add(`list-item-${card.category}`);
            listElement.appendChild(listItem);
        }
    }

    function clearInputs() {
        cardTextInput.value = '';
        intensityInput.value = '';
        updateIntensityDisplay();
    }

    // --- Event Listeners ---

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateCardPreviewColor();
        });
    });

    intensityInput.addEventListener('input', updateIntensityDisplay);

    createCardBtn.addEventListener('click', () => {
        const text = cardTextInput.value.trim();
        const intensity = intensityInput.value.trim();

        if (!currentCategory) {
            alert('Por favor, selecione uma categoria ("Nipe") primeiro.');
            return;
        }
        if (!text) {
            alert('Por favor, digite o texto da carta.');
            return;
        }

        // Nota: Para 'conexao', a intensidade pode ser opcional ou ter outro significado.
        // Aqui, salvamos como as outras por simplicidade da ferramenta.
        const newCard = {
            text: text,
            category: currentCategory,
            intensity: intensity || null
        };

        if (createdCards[currentCategory]) {
             createdCards[currentCategory].push(newCard);
        } else {
            console.error("Categoria inválida ou não inicializada encontrada:", currentCategory);
            alert("Erro: Categoria inválida selecionada. Tente selecionar novamente.");
            return;
        }

        addCardToList(newCard);
        clearInputs();
    });

    generateJsonBtn.addEventListener('click', () => {
        const allCardsArray = Object.values(createdCards).flat();

        if (allCardsArray.length === 0) {
            jsonOutput.value = 'Nenhuma carta criada ainda.';
            return;
        }

        const jsonString = JSON.stringify(allCardsArray, null, 2);
        jsonOutput.value = jsonString;
    });

    updateIntensityDisplay();
    updateCardPreviewColor();
});
