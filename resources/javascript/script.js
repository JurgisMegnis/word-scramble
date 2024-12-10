const url = "https://random-word-api.vercel.app/api?words=1&length=6";

let originalWord; // variable for the original word to compare with the answer

/* class fetching a word, splitting it in seperate letters, scrambling it and concatenating in to a string */
class WordScrambler {
    async getWord() {
        const response = await fetch(url);
        const data = await response.json();
        return data[0];
    }

    scrambleTheWord(word) {
        return word.split("")
                   .sort(() => 0.5- Math.random())
                   .join(""); 
    }
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
    originalWord = await wordScrambler.getWord();
    const scrambledWord = wordScrambler.scrambleTheWord(originalWord);
    wordDisplay.textContent = scrambledWord;
}

