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
const maxAttempts = 6; 
let difficulty = 'easy';
let timerInterval;
let timeLeft;

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
    document.getElementById("mode-display").textContent = capitalizeFirstLetter(level);
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    startGame();
}


async function startGame() {
    selectedWord = await fetchRandomWord();
    if (!selectedWord) {
        document.getElementById("message").textContent = "Failed to fetch word. Please try again.";
        document.getElementById("refresh-game-container").style.display = "block";
        return;
    }

    attempts = 0;
    guessedLetters = [];

    document.getElementById("message").textContent = "";
    document.getElementById("play-again-container").style.display = "none";
    document.getElementById("congratulations-popup").style.display = "none"; // Hide popup
    document.getElementById("refresh-game-container").style.display = "none"; // Hide refresh button

    document.querySelectorAll(".game-hangman-part").forEach(part => {
        part.style.display = "none";
        part.classList.remove("game-over");
    });

    displayWord();
    displayLetters();
    displayStrikes();
    enableKeyboard();
    startTimer(); // Start the timer
}

function startTimer() {
    clearInterval(timerInterval);
    document.getElementById("timer-container").style.display = "block";

    switch (difficulty) {
        case 'easy':
            timeLeft = 60;
            break;
        case 'medium':
            timeLeft = 30;
            break;
        case 'hard':
            timeLeft = 10;
            break;
    }

    document.getElementById("timer").textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    attempts++;
    displayStrikes();
    showGameHangmanPart();
    checkGameStatus();
    if (attempts < maxAttempts) {
        startTimer(); // Restart the timer if the game is not over
    }
}

function displayWord() {
    const wordContainer = document.getElementById("word");
    wordContainer.innerHTML = "";
    selectedWord.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = guessedLetters.includes(letter) ? letter : "_";
        span.classList.add("letter");
        if (guessedLetters.includes(letter)) {
            span.style.color = "black";
        }
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
        button.className = 'letter-button';
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
        showGameHangmanPart(); // Show part of the hangman
        displayStrikes();
    } else {
        letterButton.classList.add("correct");
        correctSound.currentTime = 0; // Reset the sound to the beginning
        correctSound.play(); // Play correct sound
    }
    letterButton.disabled = true;
    displayWord();
    checkGameStatus();
    clearInterval(timerInterval);
    startTimer();
}

function showGameHangmanPart() {
    if (attempts > 0 && attempts <= maxAttempts) {
        const parts = document.querySelectorAll(".game-hangman-part");
        parts[attempts - 1].style.display = "block";
    }
}

function checkGameStatus() {
    if (attempts === maxAttempts) {
        const gameOverPopup = document.getElementById("game-over-popup");
        const gameOverMessage = document.getElementById("game-over-message");

        // Create a span element to wrap the correct word
        const correctWordSpan = `<span class="correct-word">${selectedWord}</span>`;
        gameOverMessage.innerHTML = `Game Over! The word was: ${correctWordSpan}`;
        gameOverPopup.style.display = "block";
        disableKeyboard();

        // Add the game-over class to all hangman parts
        document.querySelectorAll(".game-hangman-part").forEach(part => {
            part.classList.add("game-over");
        });
    } else if (selectedWord.split("").every(letter => guessedLetters.includes(letter))) {
        document.getElementById("message").textContent = "Congratulations! You've guessed the word!";
        document.getElementById("play-again-container").style.display = "block";
        showConfetti();
        showCongratulationsPopup();
        disableKeyboard();
    }
}

function playAgain() {
    document.getElementById("game-over-popup").style.display = "none";
    startGame();
}

function switchModes() {
    document.getElementById("game-over-popup").style.display = "none";
    document.getElementById("game-container").style.display = "none";
    document.getElementById("mode-selection").style.display = "block";
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
    popup.style.animation = "verticalMove 1s infinite";
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

document.getElementById("play-again").addEventListener("click", () => {
    startGame();
});

document.getElementById("switch-mode").addEventListener("click", () => {
    switchModes();
});

document.getElementById("refresh-game").addEventListener("click", () => {
    startGame();
});

window.onload = () => {
    document.getElementById("home-page").style.display = "block";
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("game-container").style.display = "none";
};

// Title Animation and Navigation to Mode Selection
document.addEventListener("DOMContentLoaded", () => {
    const titleElement = document.getElementById("title");
    const playNowButton = document.getElementById("play-now");

    // Function to animate the drawing of the title
    function animateTitle() {
        let text = "Hangman";
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                titleElement.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    // Show hangman animation
                    transformGToHangman();
                }, 500);
            }
        }, 500);
    }

    // Function to transform 'g' into hangman
    function transformGToHangman() {
        let titleText = titleElement.textContent;
        titleElement.innerHTML = "";
        for (let i = 0; i < titleText.length; i++) {
            let span = document.createElement('span');
            span.textContent = titleText[i];
            if (titleText[i] === 'g') {
                span.id = "hangman-g";
                span.style.position = "relative";
                span.style.display = "inline-block";
            }
            titleElement.appendChild(span);
        }

        setTimeout(() => {
            let gElement = document.getElementById("hangman-g");
            if (gElement) {
                gElement.innerHTML = '<div class="home-hangman-part head"></div>' +
                                     '<div class="home-hangman-part body"></div>' +
                                     '<div class="home-hangman-part left-arm"></div>' +
                                     '<div class="home-hangman-part right-arm"></div>' +
                                     '<div class="home-hangman-part left-leg"></div>' +
                                     '<div class="home-hangman-part right-leg"></div>';
                gElement.style.position = "relative";
                gElement.style.width = "20px";
                gElement.style.height = "60px";
                gElement.style.transform = "rotate(0deg)";

                animateHomeHangman();
            }
        }, 500);
    }

    // Function to animate the hangman on the home page
    function animateHomeHangman() {
        const parts = document.querySelectorAll("#hangman-g .home-hangman-part");
        let index = 0;
        const interval = setInterval(() => {
            if (index < parts.length) {
                parts[index].style.display = "block";
                index++;
            } else {
                clearInterval(interval);
                document.getElementById("play-now").style.display = "block";
            }
        }, 500);
    }

    playNowButton.addEventListener("click", () => {
        document.getElementById("home-page").style.display = "none";
        document.getElementById("mode-selection").style.display = "block";
    });

    animateTitle();
});

// Tooltip for Difficulty Buttons
document.getElementById('easy-button').addEventListener('mouseover', () => showTooltip('Easy mode: 3-5 letters'));
document.getElementById('easy-button').addEventListener('mouseout', hideTooltip);
document.getElementById('medium-button').addEventListener('mouseover', () => showTooltip('Medium mode: 6-8 letters'));
document.getElementById('medium-button').addEventListener('mouseout', hideTooltip);
document.getElementById('hard-button').addEventListener('mouseover', () => showTooltip('Hard mode: 9-12 letters'));
document.getElementById('hard-button').addEventListener('mouseout', hideTooltip);

function showTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    function moveTooltip(event) {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
    }

    document.addEventListener('mousemove', moveTooltip);

    function removeTooltip() {
        tooltip.remove();
        document.removeEventListener('mousemove', moveTooltip);
        document.removeEventListener('mouseout', removeTooltip);
    }

    document.addEventListener('mouseout', removeTooltip);
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

