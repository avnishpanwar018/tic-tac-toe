/* ========================================
   Tic Tac Toe - JavaScript Logic
   ======================================== */

// Game state variables
let board = ['', '', '', '', '', '', '', '', '']; // 9 cells, empty initially
let currentPlayer = 'X'; // X always starts first
let gameActive = true; // Is the game currently in progress?
let isAiMode = false; // Are we playing against AI?
let soundEnabled = true; // Sound effects on/off

// Score tracking
let scoreX = 0;
let scoreO = 0;

// DOM elements - cache for performance
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const scoreXDisplay = document.getElementById('scoreX');
const scoreODisplay = document.getElementById('scoreO');
const restartBtn = document.getElementById('restartBtn');
const pvpModeBtn = document.getElementById('pvpMode');
const aiModeBtn = document.getElementById('aiMode');
const soundToggle = document.getElementById('soundToggle');

// Winning combinations - indices that form a line
const winningConditions = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

// ========================================
// Audio Setup - Web Audio API
// ========================================

// Create audio context for generating sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Play a sound effect using Web Audio API
 * @param {string} type - The type of sound: 'move', 'win', 'draw'
 */
function playSound(type) {
    // Don't play sound if disabled
    if (!soundEnabled) return;

    // Resume audio context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Create oscillator for generating tones
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect oscillator to gain, then to output
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sound characteristics for each type
    switch (type) {
        case 'move':
            // Short blip for placing a mark
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'win':
            // Triumphant ascending tones
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
            oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3); // C6
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;

        case 'draw':
            // Soft neutral tone
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}

// ========================================
// Game Logic Functions
// ========================================

/**
 * Handle a cell click
 * @param {HTMLElement} cell - The clicked cell element
 * @param {number} index - The index of the cell (0-8)
 */
function handleCellClick(cell, index) {
    // Ignore click if:
    // - Game is over
    // - Cell is already taken
    // - It's AI's turn in AI mode
    if (!gameActive || board[index] !== '' || (isAiMode && currentPlayer === 'O')) {
        return;
    }

    // Make the move
    makeMove(index);

    // If AI mode and game still active, trigger AI move
    if (isAiMode && gameActive && currentPlayer === 'O') {
        // Add delay for more natural feel
        setTimeout(makeAiMove, 500);
    }
}

/**
 * Make a move on the board
 * @param {number} index - The cell index to place mark
 */
function makeMove(index) {
    // Update board state
    board[index] = currentPlayer;

    // Update DOM
    const cell = cells[index];
    cell.textContent = currentPlayer;
    cell.classList.add('taken', currentPlayer.toLowerCase(), 'pop');

    // Play move sound
    playSound('move');

    // Check for win or draw
    if (checkWin()) {
        handleWin();
    } else if (checkDraw()) {
        handleDraw();
    } else {
        // Switch to next player
        switchPlayer();
    }
}

/**
 * Check if current player has won
 * @returns {boolean} - True if win detected
 */
function checkWin() {
    // Check each winning condition
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];

        // Check if all three cells have current player's mark
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}

/**
 * Get the winning line if there is one
 * @returns {number[]|null} - Array of winning cell indices or null
 */
function getWinningLine() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];

        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return [a, b, c];
        }
    }
    return null;
}

/**
 * Check if the game is a draw
 * @returns {boolean} - True if board is full with no winner
 */
function checkDraw() {
    // Check if all cells are filled
    return board.every(cell => cell !== '');
}

/**
 * Handle win state
 */
function handleWin() {
    gameActive = false;

    // Update and display status
    statusDisplay.textContent = `${currentPlayer} Wins!`;
    statusDisplay.className = 'status win';

    // Update score
    if (currentPlayer === 'X') {
        scoreX++;
        scoreXDisplay.textContent = scoreX;
    } else {
        scoreO++;
        scoreODisplay.textContent = scoreO;
    }

    // Highlight winning cells
    const winningLine = getWinningLine();
    if (winningLine) {
        winningLine.forEach(index => {
            cells[index].classList.add('winner');
        });
    }

    // Play win sound
    playSound('win');
}

/**
 * Handle draw state
 */
function handleDraw() {
    gameActive = false;

    // Update status
    statusDisplay.textContent = "It's a Draw!";
    statusDisplay.className = 'status draw';

    // Play draw sound
    playSound('draw');
}

/**
 * Switch to the next player
 */
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

/**
 * Update status display based on current player
 */
function updateStatus() {
    statusDisplay.className = 'status';

    if (currentPlayer === 'X') {
        statusDisplay.textContent = "X's Turn";
        statusDisplay.classList.add('x-turn');
    } else {
        if (isAiMode) {
            statusDisplay.textContent = "AI is thinking...";
        } else {
            statusDisplay.textContent = "O's Turn";
        }
        statusDisplay.classList.add('o-turn');
    }
}

// ========================================
// AI Logic
// ========================================

/**
 * Make a random AI move
 */
function makeAiMove() {
    if (!gameActive) return;

    // Find all empty cells
    const emptyCells = [];
    board.forEach((cell, index) => {
        if (cell === '') {
            emptyCells.push(index);
        }
    });

    // If no empty cells (shouldn't happen), return
    if (emptyCells.length === 0) return;

    // Pick random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const aiMove = emptyCells[randomIndex];

    // Make the move
    makeMove(aiMove);
}

// ========================================
// Game Control Functions
// ========================================

/**
 * Restart the game - clear board but keep scores and mode
 */
function restartGame() {
    // Reset game state
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;

    // Clear all cells in DOM
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell'; // Reset to base class only
    });

    // Reset status
    updateStatus();
}

/**
 * Switch game mode to Player vs Player
 */
function setPvpMode() {
    isAiMode = false;
    pvpModeBtn.classList.add('active');
    aiModeBtn.classList.remove('active');
    restartGame();
}

/**
 * Switch game mode to Player vs AI
 */
function setAiMode() {
    isAiMode = true;
    aiModeBtn.classList.add('active');
    pvpModeBtn.classList.remove('active');
    restartGame();
}

/**
 * Toggle sound effects on/off
 */
function toggleSound() {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        soundToggle.classList.remove('muted');
        soundToggle.querySelector('.sound-icon').textContent = '🔊';
    } else {
        soundToggle.classList.add('muted');
        soundToggle.querySelector('.sound-icon').textContent = '🔇';
    }
}

// ========================================
// Event Listeners
// ========================================

// Add click listeners to all cells
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(cell, index));
});

// Restart button
restartBtn.addEventListener('click', restartGame);

// Mode selection buttons
pvpModeBtn.addEventListener('click', setPvpMode);
aiModeBtn.addEventListener('click', setAiMode);

// Sound toggle
soundToggle.addEventListener('click', toggleSound);

// Initialize status on page load
updateStatus();