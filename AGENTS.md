# Reglas del Proyecto (PanaSecreto)

## Ejecución y Compilación Mobile (`@panasecreto/mobile`)

1. **Uso Exclusivo de Expo Go**:
   - La ejecución y previsualización de la aplicación móvil se realiza **únicamente** a través de la app de **Expo Go** (`expo start` / `pnpm --filter @panasecreto/mobile start`).

2. **PROHIBICIÓN TOTAL DE `expo export`**:
   - **NUNCA** ejecutar `expo export`, `npx expo export`, ni ningún comando de empaquetado/exportación estática.
   - **NUNCA** sugerir ni preguntar al usuario sobre hacer un `export`. Está terminantemente prohibido bajo cualquier circunstancia.

3. **Estabilidad y Recursos**:
   - Evitar comandos pesados en segundo plano que puedan saturar memoria o bloquear el entorno/IDE.
