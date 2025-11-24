// --- Oyun Ayarları ve DOM Değişkenleri ---
const gameBoard = document.getElementById('game-board');
const matchCountDisplay = document.getElementById('match-count');
const startOverlay = document.getElementById('start-overlay'); 
const livesDisplay = document.getElementById('lives-display'); 

// Mümkün olan tüm sembollerin havuzu (16 çift = 32 kart kapasitesi için)
const ALL_SYMBOLS = [
    '⭐', '🌈', '🔥', '💧', '🍎', '🚗', '💡', '🔔', 
    '⚽', '🎈', '⚙️', '🎯', '🚀', '👑', '🔑', '🧊' 
];
const BOMB_SYMBOL = '💣'; 

// --- Bölüm Zorluk Ayarları ---
// pairs: eş_sayısı (kart sayısı = pairs * 2)
// bombs: bomba_sayısı (playerLives = bombs olur)
// boardClass: CSS grid düzeni
const LEVEL_CONFIG = {
    1: { pairs: 4, bombs: 0, boardClass: 'board-small' },   // 8 kart. Can: 0 (Bomba olmadığı için can gerekmez)
    2: { pairs: 6, bombs: 1, boardClass: 'board-medium' },  // 13 kart. Can: 1
    3: { pairs: 8, bombs: 2, boardClass: 'board-medium' },  // 18 kart. Can: 2
    4: { pairs: 10, bombs: 3, boardClass: 'board-large' },  // 23 kart. Can: 3
    5: { pairs: 12, bombs: 3, boardClass: 'board-large' }   // 27 kart. Can: 3
};

// --- Durum Değişkenleri ---
let currentLevel = 1; 
let playerLives = 0; // Başlangıçta 0, initializeGame'de ayarlanır
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
    // Bomba sayısı 0 ise 'Can Yok' yazdırılabilir, aksi halde kalp sayısı bomba sayısına eşit olur.
    if (playerLives === 0 && LEVEL_CONFIG[currentLevel].bombs > 0) {
        hearts = '💔';
    } else {
        for (let i = 0; i < playerLives; i++) {
            hearts += '❤️';
        }
    }
    
    // Toplam canı da göstermek için
    const maxLives = LEVEL_CONFIG[currentLevel].bombs;
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
    
    // 1. Durumu Sıfırla/Güncelle
    gameBoard.innerHTML = '';
    
    // Tahta boyut sınıflarını ayarla
    gameBoard.className = 'game-board';
    gameBoard.classList.add(config.boardClass); 
    
    flippedCards = [];
    matchedPairs = 0;
    isProcessing = false;
    matchCountDisplay.textContent = `0 / ${config.pairs}`;
    
    // CAN SİSTEMİ GÜNCELLEMESİ: Can, o bölümdeki bomba sayısına eşitlenir.
    playerLives = config.bombs; 
    updateLivesDisplay();
    
    // 2. Kart Dizisini Bölüme Göre Hazırla
    gameCards = prepareCardsForLevel(level);

    // 3. Tahtaya Kartları Ekle
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

    // Kartları 5 saniyeliğine çevir
    allCards.forEach(card => {
        if (!card.classList.contains('matched')) {
            card.classList.add('flipped');
        }
        card.style.pointerEvents = 'none'; 
    });

    // 5 saniye sonra kartları kapat ve oyunu başlat
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
    if (currentLevel >= Object.keys(LEVEL_CONFIG).length) {
        alert("TEBRİKLER! Tüm Bölümleri Tamamladınız! Bu harika bir başarı.");
        currentLevel = 1; 
    } else {
        currentLevel++;
        alert(`Tebrikler! Bölüm ${currentLevel - 1} tamamlandı. Yeni Bölüm ${currentLevel} başlıyor!`);
    }

    // Yeni bölümü hazırla
    initializeGame(currentLevel); 
    
    // Overlay'i göster
    gameBoard.classList.add('hidden');
    startOverlay.classList.remove('hidden');
    
    // Mesajı güncelle
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
    
    // Mesajı güncelle
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
        
        if (config.bombs > 0) { // Sadece bomba varsa can kontrolü yapılır
            playerLives--;
            updateLivesDisplay();
            isProcessing = true;
            
            setTimeout(() => {
                card.classList.add('matched'); 
                
                if (playerLives <= 0) {
                    alert(`Tüm Bombaları 💥 Patlattınız! Bölüm ${currentLevel} maalesef yeniden başlıyor.`);
                    restartLevel();
                } else {
                     alert(`BOOM! 💥 Bir can kaybettiniz. Kalan Can: ${playerLives}.`);
                     // Can kaybından sonra tahtayı sıfırla ve yeniden başla
                     restartLevel(); 
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
                
                // BÖLÜM BİTTİ Mİ?
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
 * Ana Başlatma Fonksiyonu. (Oyun Sıfırlama Butonu)
 */
function restartGame() {
    currentLevel = 1;
    initializeGame(currentLevel); 
    
    // Overlay ayarlarını yap
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