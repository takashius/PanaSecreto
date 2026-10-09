# Reglas del Proyecto (PanaSecreto)

## Ejecución y Compilación Mobile (`@panasecreto/mobile`)

1. **Uso Exclusivo de Expo Go**:
   - La ejecución y previsualización de la aplicación móvil se realiza **únicamente** a través de la app de **Expo Go** (`expo start` / `pnpm --filter @panasecreto/mobile start`).

2. **PROHIBICIÓN TOTAL DE `expo export`**:
   - **NUNCA** ejecutar `expo export`, `npx expo export`, ni ningún comando de empaquetado/exportación estática.
   - **NUNCA** sugerir ni preguntar al usuario sobre hacer un `export`. Está terminantemente prohibido bajo cualquier circunstancia.

3. **Estabilidad y Recursos**:
   - Evitar comandos pesados en segundo plano que puedan saturar memoria o bloquear el entorno/IDE.

4. **Estilos en Mobile (`@panasecreto/mobile`)**:
   - **PROHIBIDO EL USO DE TAILWIND / NATIVEWIND**: No utilizar Tailwind CSS ni NativeWind en el proyecto móvil bajo ninguna circunstancia.
   - **Uso Exclusivo de StyleSheet Nativo**: Utilizar `StyleSheet.create` de React Native con tokens de diseño (`@panasecreto/ui-tokens`).
   - **Estilos Centralizados y Globales**: Organizar los estilos en archivos centralizados dentro de `src/styles/` (ej. `theme.ts`, `auth.styles.ts`, `common.styles.ts`), evitando crear un archivo de estilos o CSS separado por cada pantalla.

