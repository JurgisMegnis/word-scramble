const url = "https://random-word-api.vercel.app/api?words=1&length=6";

let originalWord; // variable for the original word to compare with the answer

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

/* SELECTORS */

const getWordBtn = document.getElementById("get-word");
const wordDisplay = document.querySelector(".word");

/* EVENT LISTENERS */

document.addEventListener("DOMContentLoaded", displayTheWord); // generate scrambled word on document load
getWordBtn.addEventListener("click", displayTheWord); // generate scrambled word on a click

/* EVENT HANDLERS */

const wordScrambler = new WordScrambler(); // object (instance) of the WordScrambler class

/* displays the scrambled word on a click */
async function displayTheWord() {
    getWordBtn.disabled = true; // disable button during load
    wordDisplay.textContent = "Loading...";

    try {
        originalWord = await wordScrambler.getWord();
        const scrambledWord = wordScrambler.scrambleTheWord(originalWord);
        wordDisplay.textContent = scrambledWord;
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
}