import { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CreateUserRequest, ManagedUser } from '@app-types/users';
import { assignableRolesFor, isSuperAdminRole } from '../../constants/roles';
import { useAuth } from '@context/useAuth';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateUserRequest) => void;
  initialValues?: ManagedUser | null;
  loading?: boolean;
}

export default function UserFormModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading,
}: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEditing = Boolean(initialValues?._id);
  const { user } = useAuth();
  const currentRole = Array.isArray(initialValues?.role) ? initialValues?.role[0] : initialValues?.role;
  const roleOptions = Array.from(
    new Set([...assignableRolesFor(user?.role), ...(currentRole ? [currentRole] : [])])
  );
  // Al editar, el rol solo lo cambia un SUPER_ADMIN y nunca el suyo propio
  const isSelf = isEditing && initialValues?._id === user?._id;
  const canChangeRole = !isEditing || (isSuperAdminRole(user?.role) && !isSelf);
  const roleHelp = !canChangeRole
    ? isSelf
      ? t('usersManagement.roleOwnLocked')
      : t('usersManagement.roleSuperAdminOnly')
    : isEditing
      ? t('usersManagement.roleChangeLogsOut')
      : undefined;

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name,
          lastName: initialValues.lastName,
          email: initialValues.email,
          phone: initialValues.phone,
          role: Array.isArray(initialValues.role) ? initialValues.role[0] : initialValues.role,
          active: initialValues.active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          role: 'USER',
          active: true,
        });
      }
    }
  }, [open, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values);
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      open={open}
      title={isEditing ? t('usersManagement.editUser') : t('usersManagement.createUser')}
      okText={t('global.save')}
      cancelText={t('global.cancel')}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label={t('global.name')}
          rules={[{ required: true, message: 'El nombre es obligatorio' }]}
        >
          <Input placeholder="Ej. Carlos" />
        </Form.Item>

        <Form.Item name="lastName" label="Apellido">
          <Input placeholder="Ej. González" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[
            { required: true, message: 'El correo es obligatorio' },
            { type: 'email', message: 'Ingresa un correo válido' },
          ]}
        >
          <Input placeholder="correo@ejemplo.com" disabled={isEditing} />
        </Form.Item>

        <Form.Item name="phone" label={t('usersManagement.phone')}>
          <Input placeholder="+58 412 1234567" />
        </Form.Item>

        <Form.Item
          name="role"
          label={t('usersManagement.role')}
          rules={[{ required: true, message: t('usersManagement.roleRequired') }]}
          extra={roleHelp}
        >
          <Select placeholder={t('usersManagement.roleRequired')} disabled={!canChangeRole}>
            {roleOptions.map((role: string) => (
              <Select.Option key={role} value={role}>
                {t(`roles.${role}`, role)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {!isEditing && (
          <Form.Item
            name="password"
            label="Contraseña Inicial"
            rules={[
              { required: true, message: 'La contraseña es obligatoria' },
              { min: 6, message: 'Mínimo 6 caracteres' },
            ]}
          >
            <Input.Password placeholder="Contraseña temporal" />
          </Form.Item>
        )}

        <Form.Item name="active" label={t('usersManagement.status')} valuePropName="checked">
          <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
