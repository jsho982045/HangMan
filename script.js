const wordApiUrl = "https://random-word-api.herokuapp.com/word?number=1";

const correctSound = new Audio('mixkit-correct-answer-tone-2870.wav');
const incorrectSound = new Audio('tuba-sting-wrong-answer-fernweh-goldfish-1-00-02.mp3');

let selectedWord;
let attempts;
let guessedLetters;
const maxAttempts = 6;

async function fetchRandomWord() {
    try {
        const response = await fetch(wordApiUrl);
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error("Error fetching word:", error);
        return null;
    }
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
        incorrectSound.play(); // Play incorrect sound
        showHangmanPart();
        displayStrikes();
    } else {
        letterButton.classList.add("correct");
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

document.getElementById("play-again").addEventListener("click", startGame);

window.onload = startGame;
