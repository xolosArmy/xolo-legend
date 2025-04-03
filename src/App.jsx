// Página Web: Historieta Interactiva - La Leyenda del Xoloitzcuintle Web3
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dog, ShieldCheck, Sparkles, Infinity, HeartHandshake, Share2, Flame } from "lucide-react";

function App() {
  const shareUrl = encodeURIComponent("https://xolosarmy.github.io/xolo-legend/");
  const shareText = encodeURIComponent("🌀 Descubre la leyenda del Xoloitzcuintle en la era Web3: una historieta mística entre Mesoamérica y blockchain. #XolosRamirez #Web3 #HistorietaDigital");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500); // 2.5 segundos
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="text-center text-white text-3xl font-bold animate-pulse"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              🌀 Invocando la leyenda...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <main className="max-w-3xl mx-auto py-12 px-4 space-y-8">
  <img
    src="/escena1-cosmos.png"
    alt="Códice cósmico con Quetzalcóatl"
    className="rounded-2xl shadow-xl mx-auto w-full max-w-lg mb-8"
  />
  <h1 className="text-4xl font-bold text-center mb-8">🐾 La Leyenda del Xoloitzcuintle 🐾</h1>


          {/* Paneles */}
          <motion.div className="bg-black text-white rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="flex items-center gap-2"><Sparkles /> En el principio, cuando los dioses desplegaban el código fuente del universo, Quetzalcóatl forkéo la realidad con compasión.</p>
          </motion.div>

          <motion.div className="bg-white text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <p className="flex items-center gap-2"><Dog /> De ese commit cósmico nació el Xoloitzcuintle: un smart contract viviente, nodo sagrado entre mundos, guardián del Mictlán.</p>
          </motion.div>

          <motion.div className="bg-gray-100 text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <p className="flex items-center gap-2"><ShieldCheck /> Quien moría, era guiado por un Xolo, si su karma estaba limpio y su wallet espiritual verificable. Solo así validaba el paso al más allá.</p>
          </motion.div>

          <motion.div className="bg-yellow-100 text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <p className="flex items-center gap-2"><Sparkles /> Los humanos olvidaron... Pero los abuelos mexicas dejaron un oracle en piedra: “El Xolo volverá en la era del fuego digital”.</p>
          </motion.div>

          <motion.div className="bg-blue-100 text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <p className="flex items-center gap-2"><Infinity /> Hoy, en la era Web3, el Xoloitzcuintle ha sido re-minteado como NFT viviente, guardián espiritual de la blockchain del alma.</p>
          </motion.div>

          <motion.div className="bg-green-100 text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <p className="flex items-center gap-2"><HeartHandshake /> Los verdaderos xolo-holders no compran un token. Heredan una promesa ancestral, firmada con amor y eternidad.</p>
          </motion.div>

          <motion.div className="bg-red-100 text-black rounded-2xl shadow-xl p-6 text-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <p className="flex items-center gap-2"><Dog /> Porque el Xoloitzcuintle no es una mascota. Es el Ledger viviente del duelo, la guía, y el renacimiento humano.</p>
          </motion.div>

          <motion.div className="bg-purple-900 text-white rounded-2xl shadow-xl p-6 text-2xl font-bold text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.7 }}>
            <p>Mientras haya humanos con alma abierta... habrá un Xolo que los guíe. Bloque a bloque, corazón a corazón.</p>
          </motion.div>

          {/* Botones finales */}
          <div className="flex flex-col md:flex-row justify-center gap-4 pt-8">
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-2xl flex items-center gap-2 shadow-lg"
            >
              <Share2 /> Compartir en X
            </a>

            <a
              href="https://xolosarmy.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-2xl flex items-center gap-2 shadow-lg"
            >
              <Flame /> Mintea este Cómic
            </a>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
