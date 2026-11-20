# Marca EntrePanas: piezas para la web

Piezas reescaladas a partir del tablero de identidad original (1536×1024, generado con IA).
Sirven para producción web. No son vectores: si algún día aparece el archivo original
(SVG/AI/PNG grande), conviene reemplazarlas.

## Qué logo usar según el fondo

Todos son PNG con fondo transparente. El color de las letras cambia para que nunca se pierdan:

| Fondo donde va | "Entre" | "Panas" | Lema | Archivos |
|---|---|---|---|---|
| Claro (crema, blanco) | azul marino | amarillo | azul marino | `logo-principal-fondo-claro.png`, `logo-horizontal-fondo-claro.png` |
| Azul marino | blanco | amarillo | blanco | `logo-principal-fondo-azul.png`, `logo-horizontal-fondo-azul.png` |
| Amarillo | azul marino | blanco | azul marino | `logo-principal-fondo-amarillo.png`, `logo-horizontal-fondo-amarillo.png` |

`principal` = loro de cuerpo entero + nombre + lema. `horizontal` = cabeza + nombre + lema (cabecera y pie).

## Otras piezas

| Archivo | Tamaño | Fondo | Uso |
|---|---|---|---|
| `mascota.png` | 2387×1931 | transparente | Hero y secciones. El loro solo |
| `isotipo-app-1024.png` | 1024×1024 | amarillo | Ícono de la app, redes |
| `apple-touch-icon.png` | 180×180 | amarillo | iOS |
| `icon-192.png`, `icon-512.png` | 192, 512 | amarillo | Manifest web |
| `icon-512-maskable.png` | 512×512 | amarillo | Manifest web, íconos con máscara de Android |
| `favicon.ico`, `favicon-16/32/48.png` | 16, 32, 48 | amarillo | Pestaña del navegador |

## Cómo se hicieron

1. Recorte de cada pieza del tablero.
2. Reescalado 4x con Real-ESRGAN (variante `RealESRGAN_x4plus_anime_4B32F`, ONNX, licencia MIT), pensado para ilustración plana.
3. Recorte del fondo crema: se quita lo claro conectado al borde, más los huecos de las letras y el espacio entre las patas. La cara blanca del loro se conserva.
4. Colores de marca normalizados (`#0B2D5B`, `#FFC107`). Las variantes por fondo recolorean solo las letras (por posición: "Entre", "Panas", lema); el loro no se toca.
5. Los íconos de la web se derivan del isotipo amarillo (se leen bien en pestañas claras y oscuras).

## Limitaciones conocidas

- El original ya traía ruido de compresión: se nota un leve halo cerca de algunas líneas al ampliar mucho.
- Sobre azul marino, el contorno azul del loro se funde con el fondo. Es esperable y se lee bien; si hace falta más separación, ponerle detrás un círculo o una franja de otro color.
- "Panas" en blanco sobre amarillo tiene poco contraste: usarlo grande (cabeceras, bloques de marca), no como texto pequeño.
- No se incluyen el isotipo monocromo ni la silueta del favicon: sus originales eran demasiado pequeños (~190 px) y el reescalado inventaba detalles.
- Reglas del manual: no rotar, estirar ni redibujar el loro; dejar de margen la altura de la gorra; mínimo 140 px de ancho en digital.
