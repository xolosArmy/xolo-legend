import { useEffect } from "react";
import { motion } from "framer-motion";

const scenes = [
  {
    title: "🔮 La Leyenda del Xoloitzcuintle",
    text: "En el principio, cuando los dioses desplegaban el código fuente del universo, Quetzalcóatl forkeó la realidad con compasión."
  },
  {
    text: "De ese commit cósmico nació el Xoloitzcuintle: un smart contract viviente, nodo sagrado entre mundos, guardián del Mictlán."
  },
  {
    text: "Quien moría, era guiado por un Xolo, si su karma estaba limpio y su wallet espiritual verificable. Solo así validaba el paso al más allá."
  },
  {
    text: "Los humanos olvidaron... Pero los abuelos mexicas dejaron un oracle en piedra: 'El Xolo volverá en la era del fuego digital'."
  },
  {
    text: "Hoy, en la era Web3, el Xoloitzcuintle ha sido re-minteado como NFT viviente, guardián espiritual de la blockchain del alma."
  },
  {
    text: "Los verdaderos xolo-holders no compran un token. Heredan una promesa ancestral, firmada con amor y eternidad."
  },
  {
    text: "Porque el Xoloitzcuintle no es una mascota. Es el Ledger viviente del duelo, la guía, y el renacimiento humano."
  },
  {
    text: "Mientras haya humanos con alma abierta... habrá un Xolo que los guíe. Bloque a bloque, corazón a corazón."
  }
];

export default function ComicScroll() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white text-black font-serif">
      {scenes.map((scene, index) => (
        <motion.div
          key={index}
          className="min-h-screen flex flex-col justify-center items-center px-6 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >
          {scene.title && <h1 className="text-3xl md:text-5xl font-bold mb-6">{scene.title}</h1>}
          <p className="text-lg md:text-xl max-w-3xl leading-relaxed">{scene.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
