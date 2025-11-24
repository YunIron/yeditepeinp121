// --- Oyun Ayarları ve DOM Değişkenleri ---
const gameBoard = document.getElementById('game-board');
const matchCountDisplay = document.getElementById('match-count');
const startOverlay = document.getElementById('start-overlay'); 
const livesDisplay = document.getElementById('lives-display'); 

// Mümkün olan tüm sembollerin havuzu
const ALL_SYMBOLS = [
    '⭐', '🌈', '🔥', '💧', '🍎', '🚗', '💡', '🔔', 
    '⚽', '🎈', '⚙️', '🎯', '🚀', '👑', '🔑', '🧊' 
];
const BOMB_SYMBOL = '💣'; 

// --- Bölüm Zorluk Ayarları ---
const LEVEL_CONFIG = {
    1: { pairs: 4, bombs: 0, boardClass: 'board-small' },   
    2: { pairs: 6, bombs: 1, boardClass: 'board-medium' },  
    3: { pairs: 8, bombs: 2, boardClass: 'board-medium' },  
    4: { pairs: 10, bombs: 3, boardClass: 'board-large' },  
    5: { pairs: 12, bombs: 3, boardClass: 'board-large' }   
};

// --- Durum Değişkenleri ---
let currentLevel = 1; 
let playerLives = 0; 
let gameCards = []; 
let flippedCards = []; 
let matchedPairs = 0; 
let isProcessing = false; 

// --- Yardımcı Fonksiyonlar ---
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createCardElement(symbol, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.symbol = symbol; 
    card.dataset.index = index; 
    
    if (symbol === BOMB_SYMBOL) {
        card.classList.add('bomb-card');
    }

    const cardBack = document.createElement('div');
    cardBack.classList.add('card-face', 'card-back');
    cardBack.textContent = '?'; 

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-face', 'card-front');
    cardFront.textContent = symbol;

    card.appendChild(cardBack);
    card.appendChild(cardFront);

    card.addEventListener('click', () => handleCardClick(card));
    
    return card;
}

function updateLivesDisplay() {
    let hearts = '';
    const maxLives = LEVEL_CONFIG[currentLevel].bombs;
    
    if (maxLives === 0) {
        livesDisplay.innerHTML = `Can: Yok`;
        return;
    }
    
    if (playerLives <= 0) {
        hearts = '💔';
    } else {
        for (let i = 0; i < playerLives; i++) {
            hearts += '❤️';
        }
    }
    
    livesDisplay.innerHTML = `Can: ${hearts} (${playerLives}/${maxLives})`;
}

// --- Oyun Başlatma ve Bölüm Yönetimi ---

function prepareCardsForLevel(level) {
    const config = LEVEL_CONFIG[level];
    const symbolsForLevel = ALL_SYMBOLS.slice(0, config.pairs);
    
    let cardSet = [...symbolsForLevel, ...symbolsForLevel];
    
    for (let i = 0; i < config.bombs; i++) {
        cardSet.push(BOMB_SYMBOL);
    }
    
    shuffle(cardSet);
    return cardSet;
}

function initializeGame(level) {
    const config = LEVEL_CONFIG[level];
    
    gameBoard.innerHTML = '';
    
    gameBoard.className = 'game-board';
    gameBoard.classList.add(config.boardClass); 
    
    flippedCards = [];
    matchedPairs = 0;
    isProcessing = false;
    matchCountDisplay.textContent = `0 / ${config.pairs}`;
    
    playerLives = config.bombs; 
    updateLivesDisplay();
    
    gameCards = prepareCardsForLevel(level);

    gameCards.forEach((symbol, index) => {
        const cardElement = createCardElement(symbol, index);
        gameBoard.appendChild(cardElement);
    });
}

function startCountdown() {
    startOverlay.classList.add('hidden'); 
    gameBoard.classList.remove('hidden'); 

    const allCards = document.querySelectorAll('.card');
    isProcessing = true; 

    allCards.forEach(card => {
        if (!card.classList.contains('matched')) {
            card.classList.add('flipped');
        }
        card.style.pointerEvents = 'none'; 
    });

    setTimeout(() => {
        allCards.forEach(card => {
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped');
            }
            card.style.pointerEvents = 'auto'; 
        });
        isProcessing = false; 
    }, 5000); 
}

function goToNextLevel() {
    const maxLevel = Object.keys(LEVEL_CONFIG).length;
    if (currentLevel >= maxLevel) {
        alert("TEBRİKLER! Tüm Bölümleri Tamamladınız! Bu harika bir başarı.");
        currentLevel = 1; 
    } else {
        currentLevel++;
        alert(`Tebrikler! Bölüm ${currentLevel - 1} tamamlandı. Yeni Bölüm ${currentLevel} başlıyor!`);
    }

    initializeGame(currentLevel); 
    
    gameBoard.classList.add('hidden');
    startOverlay.classList.remove('hidden');
    
    const config = LEVEL_CONFIG[currentLevel];
    startOverlay.querySelector('h2').textContent = `Bölüm ${currentLevel}`;
    const totalCards = config.pairs * 2 + config.bombs;
    const canMesaji = config.bombs === 0 ? "Bomba yok, can gerekmez." : `Can: ${config.bombs} adet (Bomba sayısı kadar).`;
    startOverlay.querySelector('p').innerHTML = `Kart Sayısı: ${totalCards}. Bomba: ${config.bombs} adet. ${canMesaji}`;
}

function restartLevel() {
    initializeGame(currentLevel); 
    
    gameBoard.classList.add('hidden');
    startOverlay.classList.remove('hidden');
    
    const config = LEVEL_CONFIG[currentLevel];
    const totalCards = config.pairs * 2 + config.bombs;
    const canMesaji = config.bombs === 0 ? "Bomba yok, can gerekmez." : `Can: ${config.bombs} adet (Bomba sayısı kadar).`;
    startOverlay.querySelector('h2').textContent = `Bölüm ${currentLevel} (Yeniden)`;
    startOverlay.querySelector('p').innerHTML = `Kart Sayısı: ${totalCards}. Bomba: ${config.bombs} adet. ${canMesaji}`;
}

// --- Ana Kart Tıklama Mantığı ---

function handleCardClick(card) {
    if (flippedCards.length === 2 || card.classList.contains('flipped') || isProcessing) {
        return; 
    }

    card.classList.add('flipped');
    
    // BOMBA KONTROLÜ
    if (card.dataset.symbol === BOMB_SYMBOL) {
        
        const config = LEVEL_CONFIG[currentLevel];
        
        if (config.bombs > 0) {
            isProcessing = true;
            playerLives--; // Canı 1 azalt
            updateLivesDisplay();
            
            setTimeout(() => {
                card.classList.add('matched'); // Bomba kartı pasif kalır
                
                // DÜZELTME: SADECE CAN <= 0 İSE BÖLÜM YENİDEN BAŞLAR
                if (playerLives <= 0) {
                    alert(`Tüm Bombaları 💥 Patlattınız! Bölüm ${currentLevel} maalesef yeniden başlıyor.`);
                    restartLevel();
                } else {
                     // Can > 0 ise, oyuna devam et
                     alert(`BOOM! 💥 Bir can kaybettiniz. Kalan Can: ${playerLives}.`);
                     
                     // Kartı geri çevirip durumu sıfırla, seviyeyi sıfırlama!
                     card.classList.remove('flipped');
                     card.classList.remove('matched');
                     isProcessing = false;
                }
            }, 800);
            return; 
        }
    }
    
    flippedCards.push(card); 

    // Eşleşme Kontrolü
    if (flippedCards.length === 2) {
        isProcessing = true;
        const [card1, card2] = flippedCards;
        const config = LEVEL_CONFIG[currentLevel]; 

        if (card1.dataset.symbol === card2.dataset.symbol) {
            // Eşleşme Başarılı
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                
                matchedPairs++;
                matchCountDisplay.textContent = `${matchedPairs} / ${config.pairs}`;

                flippedCards = [];
                isProcessing = false;
                
                if (matchedPairs === config.pairs) {
                    setTimeout(() => goToNextLevel(), 500);
                }
            }, 700); 
            
        } else {
            // Eşleşme Başarısız
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                
                flippedCards = [];
                isProcessing = false;
            }, 1200);
        }
    }
}

/**
 * Ana Başlatma Fonksiyonu. 
 */
function restartGame() {
    currentLevel = 1;
    initializeGame(currentLevel); 
    
    const config = LEVEL_CONFIG[currentLevel];
    startOverlay.querySelector('h2').textContent = `Bölüm ${currentLevel}`;
    const totalCards = config.pairs * 2 + config.bombs;
    const canMesaji = config.bombs === 0 ? "Bomba yok, can gerekmez." : `Can: ${config.bombs} adet (Bomba sayısı kadar).`;
    startOverlay.querySelector('p').innerHTML = `Kart Sayısı: ${totalCards}. Bomba: ${config.bombs} adet. ${canMesaji}`;

    gameBoard.classList.add('hidden');
    startOverlay.classList.remove('hidden');
}


// --- Başlangıç ---
restartGame();
