import { useEffect } from "react";
import { motion } from "framer-motion";

const scenes = [
  {
    title: "🔮 La Leyenda del Xoloitzcuintle",
    text: "En el principio, cuando los dioses desplegaban el código fuente del universo, Quetzalcóatl forkeó la realidad con compasión.",
    image: "/escena1-cosmos.png",
  },
  {
    text: "De ese commit cósmico nació el Xoloitzcuintle: un smart contract viviente, nodo sagrado entre mundos, guardián del Mictlán.",
    image: "/images/escena2-xolo-nace.png",
  },
  {
    text: "Quien moría, era guiado por un Xolo, si su karma estaba limpio y su wallet espiritual verificable. Solo así validaba el paso al más allá.",
    image: "/images/escena3-rio-mictlan.png",
  },
  {
    text: "Los humanos olvidaron... Pero los abuelos mexicas dejaron un oracle en piedra: 'El Xolo volverá en la era del fuego digital'.",
    image: "/images/escena4-oraculo-piedra.png",
  },
  {
    text: "Hoy, en la era Web3, el Xoloitzcuintle ha sido re-minteado como NFT viviente, guardián espiritual de la blockchain del alma.",
    image: "/images/escena5-nft-web3.png",
  },
  {
    text: "Los verdaderos xolo-holders no compran un token. Heredan una promesa ancestral, firmada con amor y eternidad.",
    image: "/images/escena6-promesa.png",
  },
  {
    text: "Porque el Xoloitzcuintle no es una mascota. Es el Ledger viviente del duelo, la guía, y el renacimiento humano.",
    image: "/images/escena7-ledger-viviente.png",
  },
  {
    text: "Mientras haya humanos con alma abierta... habrá un Xolo que los guíe. Bloque a bloque, corazón a corazón.",
    image: "/images/escena8-final.png",
  },
];

export default function ComicScroll() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-black text-white font-serif">
      {scenes.map((scene, index) => (
        <motion.div
          key={index}
          className="min-h-screen flex flex-col justify-center items-center px-4 py-12 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {scene.title && (
            <h1 className="text-4xl font-bold mb-4">{scene.title}</h1>
          )}
          <img
            src={scene.image}
            alt={`Escena ${index + 1}`}
            className="w-full max-w-3xl rounded-2xl shadow-lg mb-6"
          />
          <p className="text-lg md:text-xl max-w-2xl leading-relaxed">
            {scene.text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
