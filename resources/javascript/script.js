/*  VARIABLES & SELECTORS */

const url = "https://random-word-api.vercel.app/api?words=1&length=6";
let originalWord; // variable for the original word to compare with the guess

const DOM = {
    gameContainer: document.querySelector('.game-container'),
    getWordBtn: document.getElementById("get-word"),
    submitBtn: document.getElementById('submit'),
    wordDisplay: document.querySelector(".word"),
    inputs: document.querySelectorAll(".inputs input"),
    triesIndicators: document.querySelectorAll('ol li'),
    triesMessage: document.querySelector('.tries-label'),
    wordsGuessed: document.querySelector('.words-guessed'),
    inputsContainer: document.querySelector('.inputs'),
    newGameBtn: document.getElementById('reset'),
    gameOverOverlay: document.querySelector('.game-over'),
    gameOverMessage: document.querySelector('.game-over-counter')
}

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
        if (!guess) {
            AnimationUtlis.shake(DOM.inputsContainer);
            return;
        } 
        
        if (guess && guess === originalWord) {
            NotificationUtils.showStatus("Correct!", "success");
            DOM.inputs.forEach(input => input.value = '');
            displayTheWord();
            scoreTracker.trackGuess();
            return;
        } 
        
        if (scoreTracker.mistakes === scoreTracker.triesIndicators.length-1) {
            DOM.gameOverOverlay.hidden = false;
            DOM.gameOverMessage.textContent = `You guessed ${scoreTracker.guesses} words`;
            return;

        }
        
        NotificationUtils.showStatus("Not the word", "error");
        scoreTracker.mistakes++;
        scoreTracker.trackMistake();
        AnimationUtlis.flashInputs(DOM.inputs);
        AnimationUtlis.shake(DOM.inputsContainer);
        DOM.inputs.forEach(input => input.value = '');
        this.inputs[0].focus();
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

    /* reset mistake indicators on a new game start */
    resetMistakes() {
        this.mistakes = 0;
        this.updateTriesMessage();
        DOM.triesIndicators.forEach( (indicator) => {
            indicator.classList.remove('filled');
        })
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

    resetGuess() {
        this.guesses = 0;
        this.wordsGuessed.textContent = this.guesses;
    }
}

/* animation related functions */
const AnimationUtlis = {
    /* add shake animation to an element */
    shake(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake')
    }, 500); // matches animation duration
    },

    /* add animation flashing input fields red */
    flashInputs(inputs) {
        inputs.forEach(input => {
            input.classList.add('flash');
        });
    
        setTimeout(() => {
            inputs.forEach(input => {
                input.classList.remove('flash');
            });
        }, 1000);
    },

    /* assign animate class to the getWordBtnIcon */
    rotateIcon() {
        const getWordBtnIcon = document.querySelector('.secondary svg');
        getWordBtnIcon.classList.add('animate');
        setTimeout(() => {
            getWordBtnIcon.classList.remove('animate')
        }, 500)
    }
}

/* notification related functions */
const NotificationUtils = {
    /* generating a toast for error messages */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // remove it after 3s
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    },

    /* status message */
    showStatus(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-${type}`;
        toast.textContent = message;
        DOM.gameContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 1500);
    }
}

/* INSTANCES */

const wordScrambler = new WordScrambler(); // object (instance) of the WordScrambler class
const inputHandler = new InputHandler(DOM.inputs); // instance of the InputHandler class
const scoreTracker = new ScoreTracker(DOM.triesIndicators, DOM.triesMessage, DOM.wordsGuessed); // instance of the ScoreTracker class

scoreTracker.updateTriesMessage(); // initial setup call

/* EVENT LISTENERS */

document.addEventListener("DOMContentLoaded", displayTheWord); // generate scrambled word on document load
DOM.getWordBtn.addEventListener("click", displayTheWord); // generate scrambled word on a click
DOM.getWordBtn.addEventListener('click', AnimationUtlis.rotateIcon); // assign animate class to the getWordBtnIcon
DOM.submitBtn.addEventListener('click', () => inputHandler.checkInput()); // submits the guess

DOM.inputs.forEach((input, index) => {
    input.addEventListener('input', () => inputHandler.handleInput(input, index)); 
    input.addEventListener('keydown', (e) => {
        inputHandler.handleBackspace(e, input, index); // delete characters on Backspace
        
        if (e.key === 'Enter') {
            inputHandler.checkInput(); // submit the guess on Enter
        }

        if(e.key === ' ') {
            e.preventDefault(); // prevents players to use space
        }
    }); 
    input.addEventListener('focus', () => inputHandler.handleFocus(index)); 
});
DOM.newGameBtn.addEventListener('click', resetGame);

/* EVENT HANDLERS */

/* displays the scrambled word on a click */
async function displayTheWord() {
    DOM.getWordBtn.disabled = true; // disable button during load
    DOM.wordDisplay.textContent = "..."; // show on load
    DOM.inputs[0].focus(); // focus on the first input

    try {
        originalWord = await wordScrambler.getWord();
        const scrambledWord = wordScrambler.scrambleTheWord(originalWord);
        DOM.wordDisplay.textContent = scrambledWord;
        console.log(originalWord);
    } catch(error) {
        console.error('Error in displayTheWord:', error);
        DOM.wordDisplay.textContent = "";
        // showing specific error messages based on the error type
        if(error.message.includes('HTTP error')) {
            NotificationUtils.showError("Unable to connect to server. Please try again later.");
        } else if (error.message.includes('No word received')) {
            NotificationUtils.showError("No word available. Please try again.");
        } else {
            NotificationUtils.showError("An unexpected error occurred. Please try again later.");
        }
    } finally {
        DOM.getWordBtn.disabled = false;
    }
};

/* HELPER FUNCTIONS */

/* start new game */
function resetGame() {
    DOM.gameOverOverlay.hidden = true;
    DOM.inputs.forEach(input => input.value = '');
    displayTheWord();
    scoreTracker.resetMistakes();
    scoreTracker.resetGuess();
}