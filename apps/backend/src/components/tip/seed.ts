import type { TipScreen } from '@panasecreto/shared';

/**
 * Tips iniciales (los que ya tenía la app + nuevos con la misma picardía).
 * Se insertan solo si la colección está vacía; después se administran desde el panel.
 */
export const TIP_SEED: Array<{ text: string; screens: TipScreen[]; weight?: number }> = [
  // Generales del juego
  { text: '¡Pilas, mi pana! En EntrePanas nadie sabe quién le regala a quién hasta el destape final.', screens: ['general', 'grupos'], weight: 2 },
  { text: 'Lo que pasa en el sorteo se queda en el sorteo. Ni a tu mamá le cuentes quién te tocó 🤐', screens: ['general'] },
  { text: 'Un buen regalo no tiene que ser caro: tiene que ser pensado. Respeta el presupuesto del grupo.', screens: ['general', 'grupo.resumen'] },
  { text: 'Si te hacen muchas preguntas en la oficina, cambia el tema y ofrece un tequeño.', screens: ['general'] },
  { text: 'Marca el día del intercambio en tu calendario: llegar sin regalo es pecado capital.', screens: ['general', 'grupo.resumen'] },
  { text: 'Envolver bonito suma puntos. Papel de regalo, lazo y listo: cero bolsa de bodega.', screens: ['general'] },
  { text: 'Nunca le preguntes directamente a nadie qué quiere: para eso están los comentarios anónimos.', screens: ['general', 'deseo.detalle'] },
  // Grupos
  { text: 'Invita a tus panas con el código del grupo: lo pegan en la app y entran de una.', screens: ['grupos', 'grupo.resumen'] },
  { text: 'Mientras más panas, más bochinche. Comparte el enlace por WhatsApp y llena el grupo.', screens: ['grupos', 'grupo.resumen'] },
  { text: 'Organizador: revisa las exclusiones antes del sorteo pa’ que nadie le regale a su pareja.', screens: ['grupo.resumen', 'exclusiones'] },
  // Exclusiones
  { text: 'Evita que parejas o hermanitos se regalen entre sí. El sorteo nunca les tocará el mismo papelito.', screens: ['exclusiones'], weight: 2 },
  { text: 'No te pases con las exclusiones: si bloqueas demasiado, el sorteo no va a cuadrar.', screens: ['exclusiones'] },
  // Unirse
  { text: 'Escribe el código tal cual te lo pasaron. Lo buscamos y te mostramos el grupo antes de entrar.', screens: ['unirse'], weight: 2 },
  { text: '¿Te llegó un enlace? Ábrelo desde el teléfono y te unes sin escribir nada.', screens: ['unirse'] },
  // Sobre sellado
  { text: 'Tu sobre se abre cuando el organizador haga el sorteo. Mientras tanto, arma tu lista de deseos.', screens: ['sobre.sellado'], weight: 2 },
  { text: 'Abre tu sobre en un sitio tranquilo: la cara de sorpresa te puede delatar 😏', screens: ['sobre.sellado'] },
  { text: 'Nada de abrir el sobre en plena reunión. El que se ríe solo, se delata solo.', screens: ['sobre.sellado'] },
  // Lista de tu pana (sobre abierto)
  { text: 'Pregunta la talla o el color en los comentarios de cada deseo. Tu pana no sabrá que eres tú.', screens: ['sobre.lista', 'deseo.detalle'], weight: 3 },
  { text: 'Cuida tu anonimato en los mensajes: nada de muletillas que te delaten.', screens: ['sobre.lista', 'chat.sala'] },
  { text: 'Habla como maracucho pa’ despistar, ¡vergación! Nadie sospechará de ti.', screens: ['sobre.lista', 'chat.sala'] },
  { text: '¿No hay deseos todavía? Déjale un comentario pa’ que se anime a llenar su lista.', screens: ['sobre.lista'] },
  { text: 'Los deseos con estrella son los favoritos de tu pana. Por ahí va la cosa.', screens: ['sobre.lista', 'deseos'] },
  // Detalle del deseo
  { text: 'Pregunta si lo prefiere en otro color o tienda: tu identidad queda en secreto.', screens: ['deseo.detalle'] },
  { text: 'Si el regalo se pasa del presupuesto, pregunta por una alternativa parecida.', screens: ['deseo.detalle'] },
  { text: 'Responde los comentarios rapidito: tu pana secreto está esperando la pista.', screens: ['deseo.detalle', 'notificaciones'] },
  // Formulario de deseo
  { text: 'Pon fotos claritas y pistas precisas pa’ que tu pana la pegue del techo.', screens: ['deseo.formulario', 'deseos'], weight: 2 },
  { text: 'Usa una foto clara del producto exacto y sé específico con el nombre y el modelo.', screens: ['deseo.formulario'] },
  { text: 'Pon la talla y el color en las notas. Ahorras preguntas y te llega lo que es.', screens: ['deseo.formulario'] },
  { text: 'Agrega la tienda donde lo viste: tu pana te lo agradecerá cuando salga a comprar.', screens: ['deseo.formulario'] },
  { text: 'Pon opciones de distintos precios: así tu pana tiene de dónde escoger sin pasarse.', screens: ['deseo.formulario', 'deseos'] },
  // Deseos
  { text: 'Una lista con 3 a 5 deseos es perfecta: ni tan corta que adivinen, ni tan larga que se pierdan.', screens: ['deseos'] },
  { text: 'Revisa los comentarios de tus deseos: puede que tu pana secreto te esté preguntando algo.', screens: ['deseos', 'notificaciones'] },
  { text: 'Toca “Lista de mi pana” pa’ ver lo que quiere la persona a la que le regalas.', screens: ['deseos'] },
  // Chats
  { text: 'En el chat del grupo todos usan alias. Suelta pistas, pero no te quemes.', screens: ['chat.lista', 'chat.sala'], weight: 2 },
  { text: 'Una pista buena despista a todos menos a tu pana. Ponte creativo.', screens: ['chat.sala'] },
  { text: 'Escribe como nunca escribes: si siempre usas “jajaja”, hoy usa “jejeje”.', screens: ['chat.sala'] },
  { text: 'Los chats se cierran el día del destape. Aprovecha pa’ echar broma mientras puedas.', screens: ['chat.lista'] },
  // Notificaciones
  { text: 'Activa las notificaciones pa’ enterarte cuando tu pana comente uno de tus deseos.', screens: ['notificaciones'] },
  { text: 'Si te llega un recordatorio, es porque el gran día está cerquita. ¡Corre por ese regalo!', screens: ['notificaciones'] },
  // Revelación
  { text: '¡Llegó el destape! Dale las gracias a tu pana secreto con un abrazo bien apretado.', screens: ['revelacion'], weight: 2 },
  { text: 'Toma una foto del momento del destape: esa cara de sorpresa vale oro.', screens: ['revelacion'] },
  { text: '¿Te gustó la experiencia? Arma otro grupo con la familia pa’ la próxima parranda.', screens: ['revelacion'] },
];
