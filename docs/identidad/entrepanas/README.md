# Identidad visual EntrePanas — piezas separadas

Recortadas del tablero de identidad (1536×1024). Cada pieza viene en dos versiones:
`<pieza>.png` (fondo original) y `<pieza>-transparente.png` (fondo eliminado).

| Carpeta | Piezas |
|---|---|
| logos/ | logo-principal, logotipo, logotipo-con-lema, lema, logo-horizontal, logo-fondo-oscuro |
| mascota/ | mascota |
| iconos/ | isotipo-app, isotipo-monocromo, favicon |
| tipografia/ | tipografia-muestra |
| aplicaciones/ | aplicacion-icono-app, aplicacion-sticker, aplicacion-franela, aplicacion-taza |

## Paleta del tablero (adoptada en todo el proyecto)
| Color | Hex |
|---|---|
| Azul marino | #0B2D5B |
| Amarillo | #FFC107 |
| Celeste | #00B4D8 |
| Coral | #FF5A3D |
| Crema | #F8F7F2 |

## Limitaciones
- Resolución baja: salen de una imagen de 1536 px (isotipo ≈ 190 px, mascota ≈ 610 px).
  Sirven para maquetar y revisar, no para producción. El ícono de la app requiere 1024×1024
  y el favicon/adaptive icon necesitan versiones limpias: hace falta el archivo original
  (vector SVG/AI o PNG grande) o redibujarlas.
- En el favicon e isotipo monocromo, las zonas blancas de la cara quedaron transparentes
  (espacio negativo): sobre fondo oscuro se pierden.
- La tipografía del tablero es una redonda gruesa personalizada; en el proyecto se usa **Fredoka** (titulares) + **Nunito** (texto).
