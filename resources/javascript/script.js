/* SELECTORS */

const getWordBtn = document.getElementById("get-word");
const getWordBtnIcon = document.querySelector('.secondary svg');
const submitBtn = document.getElementById('submit');
const wordDisplay = document.querySelector(".word");
const inputs = document.querySelectorAll(".inputs input");
const triesIndicators = document.querySelectorAll('ol li');
const triesMessage = document.querySelector('.tries-label');
const wordsGuessed = document.querySelector('.words-guessed');
const gameContainer = document.querySelector('.game-container');
const inputsContainer = document.querySelector('.inputs');

/* VARIABLES */

const url = "https://random-word-api.vercel.app/api?words=1&length=6";
let originalWord; // variable for the original word to compare with the guess

/* OBJECTS */

/* class fetching a word, splitting it in seperate letters, scrambling it and concatenating in to a string */
class WordScrambler {
    async getWord() {
        try {
            const response = await fetch(url);
            if(!response.ok) {
                throw new Error(`HTTP error. Status: ${response.status}`);
            }
            const data = await response.json();
            if(!data || !data[0]) {
                throw new Error('No word received from API');
            }
            return data[0];
        } catch(error) {
            console.error('Failed to fetch word:', error);
            throw error;
        }
    }

    scrambleTheWord(word) {
        try {
            if(!word || typeof word !== 'string') {
                throw new Error ('Invalid input: word must be a non-empty string');
            }
            return word.split("")
                    .sort(() => 0.5- Math.random())
                    .join(""); 
        } catch(error) {
            console.error('Failed to scramble word:', error);
            throw error;
        }
    }
}

/* class handling input interactions */
class InputHandler {
    constructor(inputs) {
        this.inputs = inputs;
    }

    /* move the focus to the next input once the current one has reached its maximum length */
    handleInput(input, index) {
        if (input.value.length >= input.maxLength) {
            // if there's a next input, focus it
            if (index < this.inputs.length - 1) {
                this.inputs[index + 1].focus();
            }
        }
    }
    
    /* move the focus to the previous input once current ones content has been deleted */
    handleBackspace(e, input, index) {
        if (e.key === 'Backspace' && input.value.length === 0) {
            if (index > 0) {
                this.inputs[index - 1].focus();
            }
        }
    }
    
    /* always focus on the first empty input no matter which one is selected */
    handleFocus(index) {
        if (this.inputs && index > 0 && this.inputs[index - 1]) {
            if (this.inputs[index - 1].value.length === 0) {
                this.inputs[index - 1].focus();
            }
        }
    }

    /* returns a guess if the last input has a value */ 
    getGuess() {
        if (this.inputs[this.inputs.length - 1].value) {
            return Array.from(this.inputs)
                .map(input => input.value)
                .join('');
        }
        return null;
    }

    /* the guess against the originalWord */
    checkInput() {
        let guess = this.getGuess();
        if (guess && guess === originalWord) {
            statusMessage("Correct!", "success");
            inputs.forEach(input => input.value = '');
            displayTheWord();
            scoreTracker.trackGuess();
        } else if (guess && scoreTracker.mistakes === scoreTracker.triesIndicators.length-1) {
            alert(`Game over! Your score: ${scoreTracker.guesses}`);
        } else if (guess && guess != originalWord) {
            statusMessage("Not the word", "error");
            scoreTracker.mistakes++;
            scoreTracker.trackMistake();
            shakeAnimation();
        } 
    }
}

/* class checking the player score */
class ScoreTracker {
    constructor(triesIndicators, triesMessage, wordsGuessed) {
        this.mistakes = 0;
        this.guesses = 0;
        this.triesIndicators = triesIndicators;
        this.triesMessage = triesMessage;
        this.wordsGuessed = wordsGuessed;
    }
    
    /* updates the mistake indicators and calls the updateTriesMessage function */
    trackMistake() {
        if (this.mistakes <= this.triesIndicators.length) {
            this.triesIndicators[this.mistakes - 1].classList.add('filled');
            this.updateTriesMessage();
        }
    }

    /* updates the Tries(x/x) text */
    updateTriesMessage() {
        const totalTries = this.triesIndicators.length;
        this.triesMessage.textContent = `Tries (${this.mistakes}/${totalTries})`;
    }

    /* updates the guess variable and prints out how many words have user guessed */
    trackGuess() {
        this.guesses++;
        this.wordsGuessed.textContent = this.guesses;
    }
}

/* INSTANCES */

const wordScrambler = new WordScrambler(); // object (instance) of the WordScrambler class
const inputHandler = new InputHandler(inputs); // instance of the InputHandler class
const scoreTracker = new ScoreTracker(triesIndicators, triesMessage, wordsGuessed); // instance of the ScoreTracker class

scoreTracker.updateTriesMessage(); // initial setup call

/* EVENT LISTENERS */

document.addEventListener("DOMContentLoaded", displayTheWord); // generate scrambled word on document load
getWordBtn.addEventListener("click", displayTheWord); // generate scrambled word on a click
getWordBtn.addEventListener('click', animateIcon); // assign animate class to the getWordBtnIcon
submitBtn.addEventListener('click', () => inputHandler.checkInput()); // submits the guess

inputs.forEach((input, index) => {
    input.addEventListener('input', () => inputHandler.handleInput(input, index)); 
    input.addEventListener('keydown', (e) => {
        inputHandler.handleBackspace(e, input, index)
        // add enter key handling to submit a guess
        if (e.key === 'Enter' && inputHandler.getGuess()) {
            inputHandler.checkInput();
        }
    }); 
    input.addEventListener('focus', () => inputHandler.handleFocus(index)); 
});

/* EVENT HANDLERS */

/* displays the scrambled word on a click */
async function displayTheWord() {
    getWordBtn.disabled = true; // disable button during load
    wordDisplay.textContent = "Loading...";
    inputs[0].focus();

    try {
        originalWord = await wordScrambler.getWord();
        const scrambledWord = wordScrambler.scrambleTheWord(originalWord);
        wordDisplay.textContent = scrambledWord;
        console.log(originalWord);
    } catch(error) {
        console.error('Error in displayTheWord:', error);
        wordDisplay.textContent = "";
        // showing specific error messages based on the error type
        if(error.message.includes('HTTP error')) {
            showError("Unable to connect to server. Please try again later.");
        } else if (error.message.includes('No word received')) {
            showError("No word available. Please try again.");
        } else {
            showError("An unexpected error occurred. Please try again later.");
        }
    } finally {
        getWordBtn.disabled = false;
    }
};

/* HELPER FUNCTIONS */

/* generating a toast for error messages */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // remove it after 3s
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/* status message */
function statusMessage(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-${type}`;
    toast.textContent = message;
    gameContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 1100);
}

/* assign animate class to the getWordBtnIcon */
function animateIcon() {
    getWordBtnIcon.classList.add('animate');
    setTimeout(() => {
        getWordBtnIcon.classList.remove('animate')
    }, 500)
}

/* add shake animation to the inputs container */
function shakeAnimation() {
    inputsContainer.classList.add('shake');

    // Remove the class after animation ends
    setTimeout(() => {
        inputsContainer.classList.remove('shake');
    }, 500); // matches animation duration
}