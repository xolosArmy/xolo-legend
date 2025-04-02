// Página Web: Historieta Interactiva - La Leyenda del Xoloitzcuintle Web3

import { motion } from "framer-motion";
import { Dog, ShieldCheck, Sparkles, Infinity, HeartHandshake } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
    

      <main className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">🐾 La Leyenda del Xoloitzcuintle 🐾</h1>

        {/* Panel 1 */}
        <motion.div 
          className="bg-black text-white rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <p className="flex items-center gap-2"><Sparkles /> En el principio, cuando los dioses desplegaban el código fuente del universo, Quetzalcóatl forkéo la realidad con compasión.</p>
        </motion.div>

        {/* Panel 2 */}
        <motion.div 
          className="bg-white text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          <p className="flex items-center gap-2"><Dog /> De ese commit cósmico nació el Xoloitzcuintle: un smart contract viviente, nodo sagrado entre mundos, guardián del Mictlán.</p>
        </motion.div>

        {/* Panel 3 */}
        <motion.div 
          className="bg-gray-100 text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <p className="flex items-center gap-2"><ShieldCheck /> Quien moría, era guiado por un Xolo, si su karma estaba limpio y su wallet espiritual verificable. Solo así validaba el paso al más allá.</p>
        </motion.div>

        {/* Panel 4 */}
        <motion.div 
          className="bg-yellow-100 text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}>
          <p className="flex items-center gap-2"><Sparkles /> Los humanos olvidaron... Pero los abuelos mexicas dejaron un oracle en piedra: “El Xolo volverá en la era del fuego digital”.</p>
        </motion.div>

        {/* Panel 5 */}
        <motion.div 
          className="bg-blue-100 text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}>
          <p className="flex items-center gap-2"><Infinity /> Hoy, en la era Web3, el Xoloitzcuintle ha sido re-minteado como NFT viviente, guardián espiritual de la blockchain del alma.</p>
        </motion.div>

        {/* Panel 6 */}
        <motion.div 
          className="bg-green-100 text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}>
          <p className="flex items-center gap-2"><HeartHandshake /> Los verdaderos xolo-holders no compran un token. Heredan una promesa ancestral, firmada con amor y eternidad.</p>
        </motion.div>

        {/* Panel 7 */}
        <motion.div 
          className="bg-red-100 text-black rounded-2xl shadow-xl p-6 text-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}>
          <p className="flex items-center gap-2"><Dog /> Porque el Xoloitzcuintle no es una mascota. Es el Ledger viviente del duelo, la guía, y el renacimiento humano.</p>
        </motion.div>

        {/* Panel Final */}
        <motion.div 
          className="bg-purple-900 text-white rounded-2xl shadow-xl p-6 text-2xl font-bold text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}>
          <p>Mientras haya humanos con alma abierta... habrá un Xolo que los guíe. Bloque a bloque, corazón a corazón.</p>
        </motion.div>
      </main>
    </div>
  );
}
