import { User } from '../components/user/model';
import config from '../config/commons';
import { ROLES } from '../config/roles';
import { SystemConfig, DEFAULT_CONFIG } from '../components/config/model';
import { seedAliasSuggestions } from '../components/alias/store';
import { seedTips } from '../components/tip/store';
import { seedLegalDocuments } from '../components/legal/store';

/** Catálogos editables desde el panel (alias y tips): se siembran solo si están vacíos */
export async function seedCatalogs(): Promise<void> {
  try {
    const aliases = await seedAliasSuggestions();
    const tips = await seedTips();
    if (aliases || tips) console.log(`[Seed] Catálogos iniciales: ${aliases} alias, ${tips} tips.`);
  } catch (error) {
    console.warn('[Seed] Advertencia al sembrar alias/tips:', (error as Error).message);
  }
}

export async function seedAppData(): Promise<void> {
  await seedCatalogs();
  try {
    await seedLegalDocuments();
  } catch (error) {
    console.warn('[Seed] Advertencia al sembrar documentos legales:', (error as Error).message);
  }
  try {
    const adminEmail = config.userAdminEmail.trim().toLowerCase();
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      if (!config.userAdminPassword) {
        console.error(
          '[Seed] USER_ADMIN_PASSWORD no está definido: no se crea el administrador inicial. Defínelo y reinicia.'
        );
        return;
      }
      console.log(`[Seed] Creando usuario administrador inicial: ${adminEmail}`);
      const adminUser = new User({
        name: config.userAdminName,
        lastName: 'Admin',
        email: adminEmail,
        password: config.userAdminPassword,
        role: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
        active: true,
        // Obliga a cambiar la contraseña semilla en el primer inicio de sesión
        forcePasswordChangeOnNextLogin: true,
      });
      await adminUser.save();
      console.log(`[Seed] Usuario administrador creado exitosamente.`);
    }
  } catch (error) {
    console.warn('[Seed] Advertencia al verificar/crear superadmin:', (error as Error).message);
  }
}

/**
 * Migración de marca: PanaSecreto → EntrePanas.
 * Solo cambia el nombre si sigue siendo el valor por defecto anterior (respeta nombres personalizados).
 */
export async function migrateBrandName(): Promise<void> {
  try {
    const result = await SystemConfig.updateOne(
      { key: 'system', appName: 'PanaSecreto' },
      { $set: { appName: 'EntrePanas' } }
    );
    if (result.modifiedCount > 0) console.log('[Seed] Nombre de la aplicación actualizado a EntrePanas.');

    // Identidad visual 2026: solo se reemplazan los colores que siguen en los valores por defecto anteriores,
    // así se respetan los que un administrador haya personalizado.
    const LEGACY_COLORS: Array<[keyof typeof DEFAULT_CONFIG, string]> = [
      ['primaryColor', '#1E1338'],
      ['secondaryColor', '#F7A800'],
      ['accentColor', '#1D84B5'],
    ];
    for (const [field, legacy] of LEGACY_COLORS) {
      const r = await SystemConfig.updateOne(
        { key: 'system', [field]: { $regex: `^${legacy}$`, $options: 'i' } },
        { $set: { [field]: DEFAULT_CONFIG[field] } }
      );
      if (r.modifiedCount > 0) console.log(`[Seed] ${field} actualizado a la nueva paleta.`);
    }
  } catch (error) {
    console.warn('[Seed] No se pudo migrar el nombre de la aplicación:', (error as Error).message);
  }
}
