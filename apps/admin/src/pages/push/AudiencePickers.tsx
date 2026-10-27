import { useMemo, useState } from 'react';
import { Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAdminGroup, useAdminGroups } from '@api/groups';
import { useUser, useUsers } from '@api/users';

const fullName = (u: { name: string; lastName?: string }) => [u.name, u.lastName].filter(Boolean).join(' ');

/** Buscador de grupos (solo se monta cuando el aviso es para un grupo) */
export function GroupPicker({
  value,
  onChange,
  presetId,
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
  /** Grupo que llegó por ?group= (para mostrar su nombre aunque no salga en la búsqueda) */
  presetId?: string;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const groups = useAdminGroups({ q, limit: 20 });
  const preset = useAdminGroup(presetId ?? '');

  const options = useMemo(() => {
    const list = (groups.data?.results ?? []).map((g) => ({
      value: g.id,
      label: `${g.emoji ? `${g.emoji} ` : ''}${g.name} · ${t('push.membersCount', { count: g.memberCount })}`,
    }));
    const p = preset.data;
    if (p && !list.some((o) => o.value === p.id)) list.unshift({ value: p.id, label: `${p.emoji ? `${p.emoji} ` : ''}${p.name}` });
    return list;
  }, [groups.data, preset.data, t]);

  return (
    <Select
      showSearch
      allowClear
      className="w-full"
      value={value}
      onChange={(v) => onChange(v)}
      onSearch={setQ}
      filterOption={false}
      loading={groups.isFetching}
      placeholder={t('push.groupPlaceholder')}
      notFoundContent={groups.isFetching ? <Spin size="small" /> : t('push.noResults')}
      options={options}
      aria-label={t('push.audience.group')}
    />
  );
}

/** Buscador de usuarios activos, varios a la vez (solo se monta cuando el aviso es para usuarios) */
export function UserPicker({
  value,
  onChange,
  presetId,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  /** Usuario que llegó por ?user= */
  presetId?: string;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  /** Nombres de los ya elegidos, para que no se pierdan al cambiar la búsqueda */
  const [labels, setLabels] = useState<Record<string, string>>({});
  const users = useUsers({ q, limit: 20, active: 'true' });
  const preset = useUser(presetId ?? '');

  const options = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ value: string; label: string }> = [];
    const add = (id: string, label: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        list.push({ value: id, label });
      }
    };
    const p = preset.data;
    if (p) add(p._id, `${fullName(p)} · ${p.email}`);
    value.forEach((id) => labels[id] && add(id, labels[id]));
    (users.data?.results ?? []).forEach((u) => add(u._id, `${fullName(u)} · ${u.email}`));
    return list;
  }, [users.data, preset.data, value, labels]);

  return (
    <Select
      mode="multiple"
      showSearch
      allowClear
      className="w-full"
      value={value}
      onChange={(ids, opts) => {
        onChange(ids);
        const list = (Array.isArray(opts) ? opts : [opts]) as Array<{ value?: string; label?: string } | undefined>;
        setLabels((prev) => {
          const next = { ...prev };
          list.forEach((o) => {
            if (o?.value && o.label) next[o.value] = o.label;
          });
          return next;
        });
      }}
      onSearch={setQ}
      filterOption={false}
      loading={users.isFetching}
      placeholder={t('push.usersPlaceholder')}
      notFoundContent={users.isFetching ? <Spin size="small" /> : t('push.noResults')}
      options={options}
      maxCount={500}
      aria-label={t('push.audience.users')}
    />
  );
}
