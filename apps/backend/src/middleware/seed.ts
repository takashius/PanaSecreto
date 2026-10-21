import { User } from '../components/user/model';
import config from '../config/commons';
import { ROLES } from '../config/roles';
import { SystemConfig } from '../components/config/model';

export async function seedAppData(): Promise<void> {
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
  } catch (error) {
    console.warn('[Seed] No se pudo migrar el nombre de la aplicación:', (error as Error).message);
  }
}
