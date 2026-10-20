import { User } from '../components/user/model';
import config from '../config/commons';
import { ROLES } from '../config/roles';

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
