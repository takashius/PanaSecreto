import { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@app-types/users';
import { ALL_ROLES, ROLE_DESCRIPTIONS } from '../../constants/roles';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
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
          rules={[{ required: true, message: 'Selecciona un rol' }]}
        >
          <Select placeholder="Selecciona un rol">
            {ALL_ROLES.map((role: string) => (
              <Select.Option key={role} value={role}>
                {role}
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
