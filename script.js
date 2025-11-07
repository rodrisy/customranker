let players = [];
let scores = {};
let currentMatch = 0;
let round = 1;
let colorMap = {};
let matchHistory = new Set();
let roundCount = 0;
let maxRounds = 12;
let currentRoundMatches = [];
let matchIndex = 0;
let totalMatches = 0;
let completedMatches = 0;

const availableColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f',
    '#e67e22', '#1abc9c', '#34495e', '#fd79a8', '#00cec9'
];

function updateRoundSuggestion() {
    const input = document.getElementById('nameInput').value;
    const tempPlayers = input.split(',').map(name => name.trim()).filter(name => name);

    if (tempPlayers.length >= 2) {
        const suggested = Math.max(5, Math.ceil(tempPlayers.length * 0.6));
        document.getElementById('roundsInput').value = suggested;
        document.getElementById('roundsSuggestion').textContent = `Suggested: ${suggested} rounds for ${tempPlayers.length} items`;
    } else {
        document.getElementById('roundsSuggestion').textContent = '';
    }
}

function startGame() {
    const input = document.getElementById('nameInput').value;
    players = input.split(',').map(name => name.trim()).filter(name => name);

    if (players.length < 2) {
        alert("Please enter at least 2 names.");
        return;
    }

    const roundsInput = parseInt(document.getElementById('roundsInput').value);
    if (!roundsInput || roundsInput < 1) {
        alert("Please enter a valid number of rounds.");
        return;
    }

    maxRounds = roundsInput;

    colorMap = {};
    players.forEach((player, index) => {
        colorMap[player] = availableColors[index % availableColors.length];
        scores[player] = 1000;
    });

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    roundCount = 0;
    completedMatches = 0;
    calculateTotalMatches();
    nextRound();
}

function calculateTotalMatches() {
    // Estimate total matches based on rounds and player count
    totalMatches = Math.floor(players.length / 2) * maxRounds;
}

function updateProgressBar() {
    const percentage = Math.round((completedMatches / totalMatches) * 100);
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressBar').textContent = percentage + '%';
    document.getElementById('progressText').textContent =
        `Match ${completedMatches + 1} of ${totalMatches} (Round ${roundCount} of ${maxRounds})`;
}

function generateMatchupsThisRound() {
    const sortedPlayers = [...players].sort((a, b) => scores[b] - scores[a]);
    const roundPairs = [];
    const used = new Set();

    for (let i = 0; i < sortedPlayers.length - 1; i++) {
        const playerA = sortedPlayers[i];
        if (used.has(playerA)) continue;

        for (let j = i + 1; j < sortedPlayers.length; j++) {
            const playerB = sortedPlayers[j];
            const key = [playerA, playerB].sort().join('-');

            if (!used.has(playerB) && !matchHistory.has(key)) {
                roundPairs.push([playerA, playerB]);
                used.add(playerA);
                used.add(playerB);
                matchHistory.add(key);
                break;
            }
        }
    }
    return roundPairs;
}

function nextRound() {
    if (roundCount >= maxRounds) {
        showLeaderboard();
        return;
    }

    currentRoundMatches = generateMatchupsThisRound();
    matchIndex = 0;
    roundCount++;

    if (currentRoundMatches.length === 0) {
        showLeaderboard();
        return;
    }

    generateMatchup();
    updateProgressBar();
}

function generateMatchup() {
    const [player1, player2] = currentRoundMatches[matchIndex];

    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    function getRank(player) {
        return sortedPlayers.findIndex(([p]) => p === player) + 1;
    }

    document.getElementById('roundTitle').textContent =
        `Round ${roundCount} — Match ${matchIndex + 1} of ${currentRoundMatches.length}`;

    const p1Btn = document.getElementById('player1');
    const p2Btn = document.getElementById('player2');

    p1Btn.textContent = `${player1} - Rank #${getRank(player1)}`;
    p2Btn.textContent = `${player2} - Rank #${getRank(player2)}`;

    p1Btn.style.backgroundColor = colorMap[player1];
    p2Btn.style.backgroundColor = colorMap[player2];
}

function selectWinner(winnerNum) {
    const [player1, player2] = currentRoundMatches[matchIndex];
    const winner = winnerNum === 1 ? player1 : player2;
    const loser = winnerNum === 1 ? player2 : player1;

    updateElo(winner, loser);
    completedMatches++;

    matchIndex++;
    if (matchIndex >= currentRoundMatches.length) {
        nextRound();
    } else {
        generateMatchup();
        updateProgressBar();
    }
}

function updateElo(winner, loser) {
    const k = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (scores[loser] - scores[winner]) / 400));
    const expectedLoser = 1 - expectedWinner;

    scores[winner] += Math.round(k * (1 - expectedWinner));
    scores[loser] += Math.round(k * (0 - expectedLoser));
}

function showLeaderboard() {
    const leaderboard = document.getElementById('leaderboardList');
    leaderboard.innerHTML = '';

    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const totalPlayers = sortedPlayers.length;

    if (sortedPlayers[0]) {
        const [name, score] = sortedPlayers[0];
        document.getElementById('firstPlace').textContent = name;
        document.getElementById('firstPlace-points').textContent = `${score} points`;
        document.getElementById('firstPlace-ranking').textContent = `1 out of ${totalPlayers}`;
    }

    if (sortedPlayers[1]) {
        const [name, score] = sortedPlayers[1];
        document.getElementById('secondPlace').textContent = name;
        document.getElementById('secondPlace-points').textContent = `${score} points`;
        document.getElementById('secondPlace-ranking').textContent = `2 out of ${totalPlayers}`;
    }

    if (sortedPlayers[2]) {
        const [name, score] = sortedPlayers[2];
        document.getElementById('thirdPlace').textContent = name;
        document.getElementById('thirdPlace-points').textContent = `${score} points`;
        document.getElementById('thirdPlace-ranking').textContent = `3 out of ${totalPlayers}`;
    }

    sortedPlayers.forEach(([player, score], index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${player} - ${score}`;
        li.style.color = colorMap[player];
        leaderboard.appendChild(li);
    });

    document.getElementById('game').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'block';
}

function restart() {
    document.getElementById('setup').style.display = 'block';
    document.getElementById('game').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('nameInput').value = '';
    document.getElementById('roundsInput').value = '';
    document.getElementById('roundsSuggestion').textContent = '';
    players = [];
    scores = {};
    colorMap = {};
    matchHistory = new Set();
    roundCount = 0;
    completedMatches = 0;
}

function addMoreRounds() {
    maxRounds += 3;
    calculateTotalMatches();

    const nextRoundMatches = generateMatchupsThisRound();
    if (nextRoundMatches.length === 0) {
        alert("No more unique matches available!");
        showLeaderboard();
        return;
    }

    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    nextRound();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}