/**
 * Catálogo inicial de alias (≈100 por género). Se inserta solo si la colección está vacía;
 * después se administra desde el panel web.
 * Formato: "texto|emoji".
 */
const M = `Pana Misterioso|🕵️
Chamo Incógnito|🥸
Compadre Secreto|🤫
Gocho Sigiloso|🏔️
Maracucho Encubierto|🌞
Pana Arepero|🫓
Catire Escondido|👱
Mono Ninja|🐒
Chamo Parrandero|🎉
Gaitero Fantasma|🥁
Pana Tequeñero|🧀
Señor Hallaca|🎄
Compai Callaíto|🤐
Cuñado Misterioso|🎩
Pana Bacano|😎
Chamo Chévere|✨
Turpial Secreto|🐦
Llanero Oculto|🤠
Andino Discreto|🧣
Caraqueño Camuflado|🌆
Pana del Cafecito|☕
Tío Sorpresa|🎁
Pana Mandarina|🍊
Primo Encapuchado|🧥
Pana Pasapalo|🍢
Chamo Malandrín|😏
Pana Golfeado|🥐
Pana Cachapero|🌽
Galán Secreto|🌹
Pana del Dominó|🁫
Beisbolero Oculto|⚾
Pana Cuatrista|🪕
Chamo Trasnochado|🌙
Pana Ponche Crema|🥛
Pana Pan de Jamón|🍞
Duende del Ávila|⛰️
Pana Sabroso|😋
Chamo Bochinchero|📣
Pana Rumbero|🕺
Agente Arepa|🫓
Pana Malta|🍺
Chamo Echador|🦚
Pana Mamador de Gallo|🐓
Pana Patilla|🍉
Pana Canaima|🏞️
Pana Tepuy|🗻
Detective Pana|🔍
Pana Invisible|👻
Reno Criollo|🦌
Elfo Margariteño|🧝
Pana Chicha|🥤
Chamo Sifrino|💅
Pana Panelero|🍯
Capitán Sorpresa|🧭
Pana Cocuyo|✨
Rey del Aguinaldo|👑
Chamo Calidoso|🔥
Pana Jojoto|🌽
Pana Tostón|🍌
Pana Cambur|🍌
Pana Guayoyo|☕
Pana Marrón|☕
Señor Misterio|❓
Pana del Pernil|🍖
Chamo Pilas|🔋
Pana Burda de Fino|💎
Pana Zamuro|🦅
Pana Araguaney|🌼
Chamo del Joropo|💃
Pana Cucharón|🥄
Pana Bombillo|💡
Lobo Solitario|🐺
Pana Piñata|🪅
Pana Mondongo|🍲
Pana Perico|🍳
Pana Raspado|🍧
Pana Cotufa|🍿
Ninja del Sorteo|🥷
Pana del Furruco|🪘
Pana Maraquero|🪇
Chamo Silencioso|🔇
Pana Tumbarrancho|🥪
Pana Bienmesabe|🍰
Pana Quesillo|🍮
Pana Polarcito|🧊
Compadre Gaitero|🎶
Chamo Viajero|🧳
Pana Corsario|🏴‍☠️
Pana del Bulevar|🛍️
Pana Tigre|🐯
Pana Chigüire|🦫
Pana Morrocoy|🐢
Pana Cachicamo|🦔
Pana Caimán|🐊
Pana Jaguar|🐆
Pana Pegostoso|🍬
Pana Bandido|🦝
Pana Bodeguero|🏪
Pana Santa Chamo|🎅
Pana Grinch Bueno|💚`;

const F = `Pana Misteriosa|🕵️‍♀️
Chama Incógnita|🥸
Comadre Secreta|🤫
Gocha Sigilosa|🏔️
Maracucha Encubierta|🌞
Pana Arepera|🫓
Catira Escondida|👱‍♀️
Mona Ninja|🐒
Chama Parrandera|🎉
Gaitera Fantasma|🥁
Pana Tequeñera|🧀
Señora Hallaca|🎄
Comai Callaíta|🤐
Cuñada Misteriosa|🎩
Pana Bacana|😎
Chama Chévere|✨
Turpial Secreta|🐦
Llanera Oculta|🤠
Andina Discreta|🧣
Caraqueña Camuflada|🌆
Reina del Cafecito|☕
Tía Sorpresa|🎁
Pana Mandarina|🍊
Prima Encapuchada|🧥
Princesa Pasapalo|🍢
Chama Pícara|😏
Pana Golfeada|🥐
Pana Cachapera|🌽
Dama Secreta|🌹
Reina del Dominó|🁫
Beisbolera Oculta|⚾
Pana Cuatrista|🪕
Chama Trasnochada|🌙
Doña Ponche Crema|🥛
Doña Pan de Jamón|🍞
Duenda del Ávila|⛰️
Pana Sabrosa|😋
Chama Bochinchera|📣
Pana Rumbera|💃
Agente Cachapa|🌽
Pana Maltica|🍺
Chama Sifrina|💅
Pana Mamadora de Gallo|🐓
Pana Patilla|🍉
Hada de Canaima|🧚‍♀️
Pana Tepuy|🗻
Detective Pana|🔍
Pana Invisible|👻
Reina Criolla|👸
Elfa Margariteña|🧝‍♀️
Pana Chicha|🥤
Chama Divina|💖
Pana Papelonera|🍯
Capitana Sorpresa|🧭
Pana Luciérnaga|✨
Reina del Aguinaldo|👑
Chama Calidosa|🔥
Pana Orquídea|🌸
Pana Flor de Mayo|🌺
Pana Canela|🍂
Pana Guayoyita|☕
Señorita Misterio|❓
Doña Pernil|🍖
Chama Pilas|🔋
Pana Burda de Fina|💎
Pana Guacamaya|🦜
Pana Araguaney|🌼
Chama del Joropo|💃
Doña Cucharita|🥄
Pana Estrellita|⭐
Loba Solitaria|🐺
Pana Piñata|🪅
Pana Sirena|🧜‍♀️
Pana Perla|🦪
Pana Raspadito|🍧
Pana Cotufa|🍿
Ninja del Sorteo|🥷
Pana Maraquera|🪇
Chama Silenciosa|🔇
Pana Golosa|🍫
Pana Bienmesabe|🍰
Pana Quesillo|🍮
Pana Mariposa|🦋
Comadre Gaitera|🎶
Chama Viajera|🧳
Pana Corsaria|🏴‍☠️
Pana del Bulevar|🛍️
Pana Tigresa|🐯
Pana Chigüira|🦫
Pana Morrocoya|🐢
Pana Gata|🐈
Pana Paloma|🕊️
Pana Jaguara|🐆
Pana Melcocha|🍬
Pana Bandida|🦝
Pana Bodeguera|🏪
Mamá Noela|🤶
Pana Chispita|🎇
Pana Lunita|🌙
Pana Cocada|🥥`;

const N = `Pana Secreto|🤫
Pana Incógnito|🥸
El Duende Pana|🧝
Agente 00Pana|🕶️
Sombra Navideña|🌑
Hallaca Voladora|🎄
Arepa Misteriosa|🫓
Tequeño Fantasma|🧀
Cotufa Secreta|🍿
Ponche Encubierto|🥛
Pan de Jamón Ninja|🍞
Gaita Silenciosa|🥁
Estrella Fugaz|🌠
Cometa Navideño|☄️
Copo de Nieve Tropical|❄️
Bombillito Navideño|💡
Lucecita Intermitente|✨
Regalo Andante|🎁
Lazo Rojo|🎀
Papel de Regalo|🧧
Cascabel Callado|🔔
Galleta de Jengibre|🍪
Bastón de Caramelo|🍭
Burbuja de Malta|🫧
Nube de Azúcar|☁️
Pana Sorpresa|🎉
Pana Enigma|🧩
Pana Clave|🔑
Pana Candado|🔒
Pana Brújula|🧭
Pana Faro|🗼
Pana Cohete|🚀
Pana Satélite|🛰️
Pana Meteoro|☄️
Pana Galaxia|🌌
Pana Arcoíris|🌈
Pana Trueno|⚡
Pana Huracán|🌀
Pana Brisa|🍃
Pana Playa|🏖️
Pana Médanos|🏜️
Pana Roraima|🗻
Pana Orinoco|🌊
Pana Salto Ángel|💦
Pana Los Roques|🏝️
Pana Mochima|🐬
Pana Morrocoy|🐢
Pana Coquito|🥥
Pana Mango|🥭
Pana Parchita|💛
Pana Guanábana|🍈
Pana Lechosa|🍈
Pana Tamarindo|🟤
Pana Papelón|🍋
Pana Batido|🥤
Pana Merengada|🍦
Pana Chicharrón|🥓
Pana Empanada|🥟
Pana Cachito|🥐
Pana Pastelito|🥧
Pana Mandoca|🍩
Pana Majarete|🍮
Pana Dulce de Lechosa|🍯
Pana Torta Negra|🎂
Pana Ensalada de Gallina|🥗
Pana Cuatro|🪕
Pana Maracas|🪇
Pana Furruco|🪘
Pana Tambor|🥁
Pana Parranda|🎶
Pana Aguinaldo|🎵
Pana Pesebre|⭐
Pana Gaitazo|🎺
Pana Fuegos Artificiales|🎆
Pana Doce Uvas|🍇
Pana Maleta Viajera|🧳
Pana Calzón Amarillo|💛
Pana Lentejas|🫘
Pana Brindis|🥂
Pana Abrazo|🤗
Pana Carcajada|😂
Pana Guiño|😉
Pana Chisme|🗣️
Pana Pista|🔎
Pana Lupa|🔍
Pana Antifaz|🎭
Pana Capa|🦸
Pana Sombrero|🎩
Pana Lentes Oscuros|🕶️
Pana Bufanda|🧣
Pana Telescopio|🔭
Pana Radar|📡
Pana Código|💻
Pana Robot|🤖
Pana Alien|👽
Pana Unicornio|🦄
Pana Dragón|🐉
Pana Búho|🦉
Pana Zorro|🦊
Pana Panda|🐼`;

export interface AliasSeedItem {
  text: string;
  gender: 'M' | 'F' | 'N';
  emoji: string;
}

const parse = (block: string, gender: AliasSeedItem['gender']): AliasSeedItem[] =>
  block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [text, emoji] = line.split('|');
      return { text: text.trim(), emoji: (emoji || '🎁').trim(), gender };
    });

export const ALIAS_SEED: AliasSeedItem[] = [...parse(M, 'M'), ...parse(F, 'F'), ...parse(N, 'N')];
