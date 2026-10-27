import { Alert } from '../components/common/AppDialog';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SECRET_KEY = 'entrepanas.auth.biometricSecret';
const DECLINED_KEY = 'entrepanas.auth.biometricDeclined';

type BiometricSecret = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readSecret(): Promise<BiometricSecret | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECRET_KEY);
    return raw ? (JSON.parse(raw) as BiometricSecret) : null;
  } catch {
    return null;
  }
}

async function readDeclined(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(DECLINED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function canUseBiometrics(): Promise<boolean> {
  if (!(await LocalAuthentication.hasHardwareAsync())) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function getEnrolledEmail(): Promise<string | null> {
  const secret = await readSecret();
  return secret?.email ?? null;
}

export async function isBiometricEnabled(email: string): Promise<boolean> {
  const enrolled = await getEnrolledEmail();
  return Boolean(enrolled && enrolled === normalizeEmail(email));
}

async function writeSecret(secret: BiometricSecret) {
  await SecureStore.setItemAsync(SECRET_KEY, JSON.stringify(secret));
}

export async function enableBiometric(email: string, password: string) {
  const normalized = normalizeEmail(email);
  await writeSecret({ email: normalized, password });
  const declined = (await readDeclined()).filter((item) => item !== normalized);
  await SecureStore.setItemAsync(DECLINED_KEY, JSON.stringify(declined));
}

export async function declineBiometric(email: string) {
  const normalized = normalizeEmail(email);
  const declined = await readDeclined();
  if (!declined.includes(normalized)) {
    await SecureStore.setItemAsync(DECLINED_KEY, JSON.stringify([...declined, normalized]));
  }
  const secret = await readSecret();
  if (secret?.email === normalized) {
    await SecureStore.deleteItemAsync(SECRET_KEY).catch(() => undefined);
  }
}

export async function refreshBiometricPassword(email: string, password: string) {
  if (!password || !(await isBiometricEnabled(email))) return;
  await enableBiometric(email, password);
}

export async function promptBiometric(promptMessage: string, cancelLabel = 'Cancelar') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function readBiometricSecret() {
  return readSecret();
}

function waitForDialogToClose() {
  return new Promise<void>((resolve) => setTimeout(resolve, 400));
}

/** Tras un login con contraseña correcta, ofrece guardar huella / Face ID (como UniSAN). */
export function offerBiometricAfterLogin(email: string, password: string) {
  void (async () => {
    if (!(await canUseBiometrics())) return;
    const normalized = normalizeEmail(email);
    if (await isBiometricEnabled(normalized)) {
      await refreshBiometricPassword(normalized, password);
      return;
    }
    const declined = await readDeclined();
    if (declined.includes(normalized)) return;

    Alert.alert(
      '¿Entrar con huella la próxima vez?',
      'Guardamos tus datos de acceso de forma cifrada en el teléfono. Solo tú podrás desbloquearlos con huella o Face ID.',
      [
        {
          text: 'Ahora no',
          style: 'cancel',
          onPress: () => {
            void declineBiometric(normalized);
          },
        },
        {
          text: 'Activar',
          onPress: () => {
            void (async () => {
              await waitForDialogToClose();
              const confirmed = await promptBiometric('Confirma con huella o Face ID para activar el acceso rápido');
              if (!confirmed) return;
              await enableBiometric(normalized, password);
            })();
          },
        },
      ]
    );
  })();
}
