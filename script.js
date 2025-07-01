    const board = document.getElementById("board");
    const cells = document.querySelectorAll(".cell");
    const statusText = document.getElementById("status");
    const timerText = document.getElementById("timer");
    const resetBtn = document.getElementById("resetBtn");
    const newGameBtn = document.getElementById("newGameBtn");
    const xScoreText = document.getElementById("xScore");
    const oScoreText = document.getElementById("oScore");
    const drawText = document.getElementById("draws");
    const modeSelect = document.getElementById("modeSelect");
    const difficultySelect = document.getElementById("difficultySelect");
    const toggleTheme = document.getElementById("toggleTheme");
    const toggleSound = document.getElementById("toggleSound");
    const clickSound = document.getElementById("clickSound");
    const winSound = document.getElementById("winSound");
    const drawSound = document.getElementById("drawSound");

    let boardState = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;
    let timer;
    let timeLeft = 10;
    let isSoundOn = true;
    let mode = localStorage.getItem("mode") || "player";
    let difficulty = localStorage.getItem("difficulty") || "medium";

    let scores = {
      X: parseInt(localStorage.getItem("xScore")) || 0,
      O: parseInt(localStorage.getItem("oScore")) || 0,
      Draws: parseInt(localStorage.getItem("draws")) || 0,
    };

    xScoreText.textContent = scores.X;
    oScoreText.textContent = scores.O;
    drawText.textContent = scores.Draws;
    modeSelect.value = mode;
    difficultySelect.value = difficulty;

    function playSound(sound) {
      if (isSoundOn) {
        sound.currentTime = 0;
        sound.play();
      }
    }

    function startTimer() {
      clearInterval(timer);
      timeLeft = 10;
      timerText.textContent = timeLeft;
      timer = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        if (timeLeft === 0) {
          clearInterval(timer);
          switchPlayer();
        }
      }, 1000);
    }

    function stopTimer() {
      clearInterval(timer);
    }

    function checkWinner() {
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];

      for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (
          boardState[a] &&
          boardState[a] === boardState[b] &&
          boardState[a] === boardState[c]
        ) {
          gameActive = false;
          stopTimer();
          statusText.textContent = `🎉 Congratulations, Player ${boardState[a]} wins! 🎉`;
          scores[boardState[a]]++;
          localStorage.setItem(`${boardState[a].toLowerCase()}Score`, scores[boardState[a]]);
          xScoreText.textContent = scores.X;
          oScoreText.textContent = scores.O;
          playSound(winSound);
          return true;
        }
      }

      if (!boardState.includes("")) {
        gameActive = false;
        stopTimer();
        statusText.textContent = "It's a draw!";
        scores.Draws++;
        localStorage.setItem("draws", scores.Draws);
        drawText.textContent = scores.Draws;
        playSound(drawSound);
        return true;
      }
      return false;
    }

    function switchPlayer() {
      if (!gameActive) return;
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      statusText.textContent = `Player ${currentPlayer}'s turn`;
      if (mode === "computer" && currentPlayer === "O") setTimeout(computerMove, 500);
      startTimer();
    }

    function makeMove(index) {
      if (!gameActive || boardState[index]) return;

      boardState[index] = currentPlayer;
      cells[index].textContent = currentPlayer;

      // Set color class
      cells[index].classList.remove("x", "o");
      cells[index].classList.add(currentPlayer.toLowerCase());

      playSound(clickSound);

      if (!checkWinner()) {
        switchPlayer();
      }
    }

    function resetGame() {
      boardState.fill("");
      cells.forEach((cell) => {
        cell.textContent = "";
        cell.classList.remove("x", "o");
      });
      currentPlayer = "X";
      gameActive = true;
      statusText.textContent = `Player ${currentPlayer}'s turn`;
      startTimer();
    }

    function newGame() {
      // Reset everything including scores and storage
      scores = { X: 0, O: 0, Draws: 0 };
      localStorage.setItem("xScore", 0);
      localStorage.setItem("oScore", 0);
      localStorage.setItem("draws", 0);
      xScoreText.textContent = "0";
      oScoreText.textContent = "0";
      drawText.textContent = "0";
      resetGame();
    }

    function getEmptyIndices() {
      return boardState
        .map((val, idx) => (val === "" ? idx : null))
        .filter((i) => i !== null);
    }

    function computerMove() {
      if (!gameActive) return;
      let index;
      const empty = getEmptyIndices();

      if (difficulty === "easy") {
        index = empty[Math.floor(Math.random() * empty.length)];
      } else if (difficulty === "medium") {
        index =
          empty.find((i) => {
            boardState[i] = "O";
            const win = checkWinnerForBot("O");
            boardState[i] = "";
            return win;
          }) ??
          empty[Math.floor(Math.random() * empty.length)];
      } else if (difficulty === "hard") {
        index = minimax(boardState, "O").index;
      }

      makeMove(index);
    }

    // Helper function for AI to check win without updating UI or changing gameActive status
    function checkWinnerForBot(player) {
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];

      for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (
          boardState[a] === player &&
          boardState[b] === player &&
          boardState[c] === player
        ) {
          return true;
        }
      }
      return false;
    }

    // Minimax AI (hard mode)
    function minimax(newBoard, player) {
      const availSpots = newBoard
        .map((val, idx) => (val === "" ? idx : null))
        .filter((v) => v !== null);

      if (checkWinnerForBot("X")) {
        return { score: -10 };
      } else if (checkWinnerForBot("O")) {
        return { score: 10 };
      } else if (availSpots.length === 0) {
        return { score: 0 };
      }

      const moves = [];

      for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === "O") {
          const result = minimax(newBoard, "X");
          move.score = result.score;
        } else {
          const result = minimax(newBoard, "O");
          move.score = result.score;
        }

        newBoard[availSpots[i]] = "";
        moves.push(move);
      }

      let bestMove;
      if (player === "O") {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
          if (moves[i].score > bestScore) {
            bestScore = moves[i].score;
            bestMove = moves[i];
          }
        }
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
          if (moves[i].score < bestScore) {
            bestScore = moves[i].score;
            bestMove = moves[i];
          }
        }
      }
      return bestMove;
    }

    // Event Listeners
    cells.forEach((cell) => {
      cell.addEventListener("click", () => {
        if (mode === "player" || currentPlayer === "X") {
          makeMove(parseInt(cell.dataset.index));
        }
      });
    });

    resetBtn.addEventListener("click", () => {
      resetGame();
    });

    newGameBtn.addEventListener("click", () => {
      newGame();
    });

    modeSelect.addEventListener("change", () => {
      mode = modeSelect.value;
      localStorage.setItem("mode", mode);
      resetGame();
    });

    difficultySelect.addEventListener("change", () => {
      difficulty = difficultySelect.value;
      localStorage.setItem("difficulty", difficulty);
    });

    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });

    toggleSound.addEventListener("click", () => {
      isSoundOn = !isSoundOn;
      toggleSound.textContent = isSoundOn ? "Sound: ON" : "Sound: OFF";
    });

    // Initialize
    statusText.textContent = `Player ${currentPlayer}'s turn`;
    startTimer();
    toggleSound.textContent = "Sound: ON";
