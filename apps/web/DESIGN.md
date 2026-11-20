# DESIGN.md · EntrePanas (web)

Sistema de diseño bloqueado para la landing. La fuente de verdad de la paleta es `packages/ui-tokens`; `scripts/check.test.mjs` vigila que `src/css/tokens.css` no se desvíe.

## Idea
El sobre del amigo secreto se abre en la propia portada: la mascota sostiene un sobre y el visitante lo abre para ver un alias real del catálogo.

## Tono
Alegre, festivo y muy venezolano. Frases cortas, tuteo, sin jerga corporativa. Una idea por frase.

## Color (OKLCH)
| Rol | Token | Valor |
|---|---|---|
| Papel | `--color-paper` | crema #F8F7F2 |
| Tinta | `--color-ink` | #13213A |
| Azul marino (marca) | `--color-navy` | #0B2D5B |
| Amarillo pana (acento) | `--color-accent` | #FFC107 |
| Celeste Caribe | `--color-sky` | #00B4D8 |
| Coral guacamaya | `--color-coral` | #FF5A3D |

Reglas: texto sobre amarillo siempre azul marino; sobre azul, amarillo y blanco (nunca azul sobre azul). El amarillo es el acento único de las acciones.

## Tipografía
Fredoka (títulos, botones) y Nunito (texto), alojadas en `public/fonts` (OFL). Tamaños con los tokens `--text-*`.

## Forma
Redondeado y suave: tarjetas `--radius-card` (24px), botones píldora, sombras sólidas desplazadas (efecto sticker), ligeras rotaciones. Dispositivo de marca: borde en V como solapa de sobre entre secciones.

## Logos por fondo
Claro: `logo-*-fondo-claro`. Azul: `logo-*-fondo-azul`. Amarillo: `logo-*-fondo-amarillo`. Ver `public/brand/README.md`.

## Movimiento
Solo transform y opacity; todo se apaga con `prefers-reduced-motion`. La página funciona sin JS (el sobre y el formulario son mejora progresiva).
