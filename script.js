const wordApiUrls = {
    easy: "https://random-word-api.herokuapp.com/word?number=10",
    medium: "https://random-word-api.herokuapp.com/word?number=10",
    hard: "https://random-word-api.herokuapp.com/word?number=10"
};

const correctSound = new Audio('mixkit-correct-answer-tone-2870.wav');
const incorrectSound = new Audio('tuba-sting-wrong-answer-fernweh-goldfish-1-00-02.mp3');

let selectedWord;
let attempts;
let guessedLetters;
let maxAttempts;
let difficulty = 'easy';

const jsConfetti = new JSConfetti();

function filterWordsByLength(words, minLength, maxLength) {
    return words.filter(word => word.length >= minLength && word.length <= maxLength);
}

async function fetchRandomWord() {
    try {
        const response = await fetch(wordApiUrls[difficulty]);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        let filteredWords;
        switch (difficulty) {
            case 'easy':
                filteredWords = filterWordsByLength(data, 3, 5);
                break;
            case 'medium':
                filteredWords = filterWordsByLength(data, 6, 8);
                break;
            case 'hard':
                filteredWords = filterWordsByLength(data, 9, 12);
                break;
        }
        if (filteredWords.length === 0) {
            throw new Error("No words found of the desired length");
        }
        return filteredWords[Math.floor(Math.random() * filteredWords.length)];
    } catch (error) {
        console.error("Error fetching word:", error);
        return null;
    }
}

function setDifficulty(level) {
    difficulty = level;
    switch (level) {
        case 'easy':
            maxAttempts = 6;
            break;
        case 'medium':
            maxAttempts = 8;
            break;
        case 'hard':
            maxAttempts = 10;
            break;
    }
    document.getElementById("mode-display").textContent = capitalizeFirstLetter(level);
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    startGame();
}

async function startGame() {
    selectedWord = await fetchRandomWord();
    if (!selectedWord) {
        document.getElementById("message").textContent = "Failed to fetch word. Please try again.";
        return;
    }

    attempts = 0;
    guessedLetters = [];

    document.getElementById("message").textContent = "";
    document.getElementById("play-again-container").style.display = "none";
    document.getElementById("congratulations-popup").style.display = "none"; // Hide popup

    document.querySelectorAll(".hangman-part").forEach(part => part.style.display = "none");

    displayWord();
    displayLetters();
    displayStrikes();
    enableKeyboard();
}

function displayWord() {
    const wordContainer = document.getElementById("word");
    wordContainer.innerHTML = "";
    selectedWord.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = guessedLetters.includes(letter) ? letter : "_";
        span.classList.add("letter");
        wordContainer.appendChild(span);
    });
}

function displayLetters() {
    const lettersContainer = document.getElementById("letters");
    lettersContainer.innerHTML = "";
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i).toLowerCase();
        const button = document.createElement("button");
        button.textContent = letter;
        button.setAttribute("data-key", letter);
        if (guessedLetters.includes(letter)) {
            button.disabled = true;
            button.classList.add(guessedLetters.includes(letter) && selectedWord.includes(letter) ? 'correct' : 'incorrect');
        }
        button.addEventListener("click", () => guessLetter(letter));
        lettersContainer.appendChild(button);
    }
}

function displayStrikes() {
    const strikeContainer = document.getElementById("strike-counter");
    strikeContainer.innerHTML = "";
    for (let i = 0; i < maxAttempts; i++) {
        const box = document.createElement("div");
        box.classList.add("strike-box");
        if (i < attempts) {
            box.innerHTML = '<span class="strike">X</span>';
        }
        strikeContainer.appendChild(box);
    }
}

function guessLetter(letter) {
    if (guessedLetters.includes(letter)) return; // Prevent multiple guesses of the same letter
    guessedLetters.push(letter);
    const letterButton = document.querySelector(`button[data-key="${letter}"]`);
    if (!selectedWord.includes(letter)) {
        attempts++;
        letterButton.classList.add("incorrect");
        incorrectSound.currentTime = 0; // Reset the sound to the beginning
        incorrectSound.play(); // Play incorrect sound
        showHangmanPart();
        displayStrikes();
    } else {
        letterButton.classList.add("correct");
        correctSound.currentTime = 0; // Reset the sound to the beginning
        correctSound.play(); // Play correct sound
    }
    letterButton.disabled = true;
    displayWord();
    checkGameStatus();
}

function showHangmanPart() {
    const parts = document.querySelectorAll(".hangman-part");
    if (attempts > 0 && attempts <= maxAttempts) {
        parts[attempts - 1].style.display = "block";
    }
}

function checkGameStatus() {
    if (attempts === maxAttempts) {
        document.getElementById("message").textContent = `Game Over! The word was: ${selectedWord}`;
        document.getElementById("play-again-container").style.display = "block";
        disableKeyboard();
    } else if (selectedWord.split("").every(letter => guessedLetters.includes(letter))) {
        document.getElementById("message").textContent = "Congratulations! You've guessed the word!";
        document.getElementById("play-again-container").style.display = "block";
        showConfetti();
        showCongratulationsPopup();
        disableKeyboard();
    }
}

function enableKeyboard() {
    document.addEventListener('keydown', handleKeyboardInput);
}

function disableKeyboard() {
    document.removeEventListener('keydown', handleKeyboardInput);
}

function handleKeyboardInput(event) {
    const letter = event.key.toLowerCase();
    if (letter >= 'a' && letter <= 'z' && !guessedLetters.includes(letter)) {
        guessLetter(letter);
    }
}

function showConfetti() {
    jsConfetti.addConfetti({
        confettiColors: [
            '#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'
        ],
    });
}

function showCongratulationsPopup() {
    const popup = document.getElementById("congratulations-popup");
    popup.style.display = "block";
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

document.getElementById("play-again").addEventListener("click", () => {
    startGame();
});


document.getElementById("switch-mode").addEventListener("click", () => {
    document.getElementById("game-container").style.display = "none";
    document.getElementById("mode-selection").style.display = "block";
});

window.onload = () => {
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("game-container").style.display = "none";
};


