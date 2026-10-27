import React, { useState } from 'react';
import { Alert } from '../../components/common/AppDialog';
import { useAuth } from '../../auth/AuthContext';
import { refreshBiometricPassword } from '../../auth/biometrics';
import { errorMessage } from '../../api/client';
import * as profileApi from '../../api/profile';
import { pushAvailable } from '../../notifications/push';
import { splitFullName, toInternationalPhone, toLocalPhone } from '../../utils/validation';
import ProfileScreen from './ProfileScreen';
import EditProfileScreen from './EditProfileScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
import type { DashboardTab } from '../../components/common/FloatingTabBar';
import type { ProfileView, SessionUser } from '../../types/session';

/** Perfil que muestra la app a partir del usuario de la sesión */
export function profileFromUser(user: SessionUser | null): ProfileView {
  return {
    fullname: [user?.name, user?.lastName].filter(Boolean).join(' '),
    nickname: user?.nickname ?? null,
    email: user?.email ?? '',
    phone: toLocalPhone(user?.phone) || null,
    photoUri: user?.photo ?? null,
    notifyEmail: user?.notifyEmail !== false,
    notifyComments: user?.notifyComments !== false,
    notifyPush: user?.notifyPush !== false,
  };
}

/** Sube o quita la foto según cambió `photoUri` (URI local = nueva foto) */
async function savePhoto(before: string | null | undefined, after: string | null | undefined) {
  if ((before ?? null) === (after ?? null)) return null;
  return after ? profileApi.uploadProfilePhoto(after) : profileApi.removeProfilePhoto();
}

interface ProfileContainerProps {
  stats: { groups: number; wishes: number; exchanges: number };
  onEditProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenLegal: (document: 'terminos' | 'privacidad') => void;
  chatUnread?: number;
}

/** Pestaña Perfil conectada: foto y avisos se guardan al instante (optimista, con reversa si falla) */
export const ProfileContainer: React.FC<ProfileContainerProps> = (props) => {
  const { user, updateUser } = useAuth();
  const base = profileFromUser(user);
  const [pending, setPending] = useState<Partial<ProfileView> | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const profile: ProfileView = { ...base, ...pending };

  const handleChange = async (next: ProfileView) => {
    const photoChanged = (next.photoUri ?? null) !== (profile.photoUri ?? null);
    const notifyPatch: profileApi.ProfileUpdateInput = {};
    if (next.notifyEmail !== profile.notifyEmail) notifyPatch.notifyEmail = next.notifyEmail;
    if (next.notifyComments !== profile.notifyComments) notifyPatch.notifyComments = next.notifyComments;
    if (next.notifyPush !== profile.notifyPush) notifyPatch.notifyPush = next.notifyPush;
    if (!photoChanged && Object.keys(notifyPatch).length === 0) return;

    setPending((p) => ({ ...p, ...(photoChanged ? { photoUri: next.photoUri ?? null } : {}), ...notifyPatch }));
    if (photoChanged) setPhotoBusy(true);
    try {
      const patch = photoChanged
        ? await savePhoto(profile.photoUri, next.photoUri)
        : await profileApi.updateProfile(notifyPatch);
      if (patch) updateUser(patch);
    } catch (error) {
      Alert.alert(photoChanged ? 'No pudimos cambiar tu foto' : 'No pudimos guardar tus avisos', errorMessage(error));
    } finally {
      setPending(null);
      if (photoChanged) setPhotoBusy(false);
    }
  };

  return (
    <ProfileScreen
      {...props}
      profile={profile}
      photoBusy={photoBusy}
      hasPassword={user?.hasPassword !== false}
      pushSupported={pushAvailable}
      onProfileChange={(p) => void handleChange(p)}
    />
  );
};

/** Editar perfil conectado: PATCH /me y, si cambió la foto, upload o borrado */
export const EditProfileContainer: React.FC<{ onDone: () => void; onCancel: () => void }> = ({ onDone, onCancel }) => {
  const { user, updateUser } = useAuth();
  const profile = profileFromUser(user);

  const handleSave = async (next: ProfileView) => {
    const { name, lastName } = splitFullName(next.fullname);
    const patch = await profileApi.updateProfile({
      name,
      lastName: lastName || null,
      nickname: next.nickname || null,
      phone: next.phone ? (toInternationalPhone(next.phone) ?? null) : null,
    });
    updateUser(patch);
    try {
      const photoPatch = await savePhoto(profile.photoUri, next.photoUri);
      if (photoPatch) updateUser(photoPatch);
    } catch (error) {
      // Los datos ya quedaron guardados; solo falló la foto (la pantalla sigue abierta para reintentar)
      throw new Error(`Tus datos se guardaron, pero la foto no. ${errorMessage(error)}`, { cause: error });
    }
    onDone();
  };

  return <EditProfileScreen profile={profile} onSave={handleSave} onCancel={onCancel} />;
};

/** Cambiar (o crear, si la cuenta es de Google) la contraseña */
export const ChangePasswordContainer: React.FC<{ onDone: () => void; onCancel: () => void }> = ({ onDone, onCancel }) => {
  const { user, updateUser } = useAuth();
  const hasPassword = user?.hasPassword !== false;

  const handleSubmit = async (newPassword: string, currentPassword?: string) => {
    await profileApi.changePassword(newPassword, currentPassword);
    if (user?.email) await refreshBiometricPassword(user.email, newPassword);
  };

  // La sesión se marca con contraseña al salir, para no redibujar el formulario mientras se ve el aviso
  const handleDone = () => {
    if (!hasPassword) updateUser({ hasPassword: true });
    onDone();
  };

  return <ChangePasswordScreen hasPassword={hasPassword} onSubmit={handleSubmit} onDone={handleDone} onCancel={onCancel} />;
};
