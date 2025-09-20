import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import socket from "../socket";

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [gameStatus, setGameStatus] = useState("welcome"); // welcome | lobby | playing | eliminated | finished
  const [winner, setWinner] = useState(null);
  const [username, setUsername] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  // ⏳ temporizador
  useEffect(() => {
    let timer;
    if (question?.deadline) {
      const updateTimer = () => {
        const remaining = Math.max(
          0,
          Math.floor((question.deadline - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
      };

      updateTimer(); // inicial
      timer = setInterval(updateTimer, 500);
    }

    return () => clearInterval(timer);
  }, [question]);

  // eventos de sockets
  useEffect(() => {
    socket.on("lobby-update", (players) => {
      setPlayers(players);
    });

    socket.on("game-start", ({ players }) => {
      setPlayers(players);
      setGameStatus("playing");
    });

    socket.on("new-question", (q) => {
      if (gameStatus !== "eliminated" && gameStatus !== "finished") {
        setQuestion(q);
        setGameStatus("playing");
      }
    });

    socket.on("round-update", ({ players }) => {
      setPlayers(players);

      const me = players.find((p) => p.username === username);
      if (me && me.status === "eliminated") {
        setGameStatus("eliminated");
      }
    });

    socket.on("game-over", ({ winner }) => {
      setWinner(winner);
      setGameStatus("finished");
    });

    return () => {
      socket.off("lobby-update");
      socket.off("game-start");
      socket.off("new-question");
      socket.off("round-update");
      socket.off("game-over");
    };
  }, [gameStatus, username]);

  useEffect(() => {
    socket.on("eliminated", () => {
      setGameStatus("eliminated");
    });

    return () => {
      socket.off("eliminated");
    };
  }, []);

  const joinGame = () => {
    const user = {
      userId: Date.now().toString(),
      username: username || "Jugador_" + Math.floor(Math.random() * 1000),
    };
    socket.emit("join-lobby", user);
    setGameStatus("lobby");
  };

  const sendAnswer = (option) => {
    socket.emit("answer", {
      gameId: question.gameId,
      questionId: question.questionId,
      option,
    });
  };

  // 👇 Dentro de Game.jsx
if (gameStatus === "welcome") {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-pink-600 to-blue-800 text-white px-6"
    >
      <motion.h1
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="text-4xl font-extrabold mb-6 text-center drop-shadow-lg"
      >
        🎮 Bienvenido a Pregunta2Fake
      </motion.h1>

      <input
        type="text"
        placeholder="Ingresa tu Nick"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") joinGame();
        }}
        className="p-3 rounded-xl text-white w-64 mb-4 text-center shadow-lg focus:ring-2 focus:ring-pink-500"
      />

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={joinGame}
        className="bg-cyan-600 px-8 py-3 rounded-2xl shadow-lg hover:bg-cyan-700 transition font-semibold text-lg"
      >
        🚀 Unirse
      </motion.button>
    </motion.div>
  );
}

if (gameStatus === "lobby") {
  const leaveLobby = () => {
    socket.emit("leave-lobby", { username });
    setPlayers([]);
    setGameStatus("welcome");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-pink-600 to-blue-800 text-white px-6"
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold mb-4"
      >
        ⏳ Esperando jugadores...
      </motion.h2>

      <p className="mt-2 text-lg">{players.length} / 5 conectados</p>

      <ul className="mt-6 space-y-2">
        {players.map((p, idx) => (
          <li
            key={idx}
            className="bg-white/20 px-4 py-2 rounded-xl shadow text-lg"
          >
            {p.username}
          </li>
        ))}
      </ul>

      {/* animación de puntitos */}
      <motion.div
        className="flex space-x-2 mt-6"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span className="w-3 h-3 bg-white rounded-full"></span>
        <span className="w-3 h-3 bg-white rounded-full"></span>
        <span className="w-3 h-3 bg-white rounded-full"></span>
      </motion.div>

      {/* Botón salir */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={leaveLobby}
        className="mt-8 bg-red-600 px-6 py-3 rounded-2xl shadow-lg hover:bg-red-700 transition font-semibold text-lg"
      >
        🚪 Salir
      </motion.button>
    </motion.div>
  );
}

if (gameStatus === "playing" && question) {
  return (
    <motion.div
      key={question.questionId}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white p-4"
    >
      {/* Barra de progreso */}
      <div className="w-full max-w-md mb-4">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-400"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / 15) * 100}%` }}
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
          />
        </div>
        <p className="text-sm mt-1 text-center">⏱️ {timeLeft}s restantes</p>
      </div>

      {/* Pregunta */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-xl w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-6">{question.enunciado}</h2>
        <div className="flex flex-col gap-3">
          {question.opciones.map((opt, idx) => (
            <motion.button
              key={idx}
              onClick={() => sendAnswer(opt)}
              whileTap={{ scale: 0.9 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-xl shadow hover:opacity-90 transition"
            >
              {opt}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

if (gameStatus === "eliminated") {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen 
                 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 text-white"
    >
      <h2 className="text-3xl font-bold mb-4">😢 Has sido eliminado</h2>
      <p className="text-lg">Espera hasta el final de la partida.</p>
    </motion.div>
  );
}

if (gameStatus === "finished") {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen 
                 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 text-white"
    >
      {winner ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-6xl mb-6"
          >
            🏆
          </motion.div>
          <h2 className="text-3xl font-bold mb-4">¡Ganador!</h2>
          <p className="text-2xl">{winner.username}</p>
        </>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-6xl mb-6"
          >
            🤝
          </motion.div>
          <h2 className="text-3xl font-bold mb-4">¡Empate!</h2>
          <p className="text-xl">Todos los jugadores fueron eliminados</p>
        </>
      )}
      <button
        onClick={() => {
          setWinner(null);
          setGameStatus("welcome");
          setQuestion(null);
          setPlayers([]);
        }}
        className="mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:opacity-90 transition"
      >
        🔄 Jugar de nuevo
      </button>
    </motion.div>
  );
}

  return null;
}
