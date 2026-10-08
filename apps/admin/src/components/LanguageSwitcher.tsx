import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
    localStorage.setItem('preferred-language', lng);
  };

  const items = [
    {
      key: 'es',
      label: '🇪🇸 Español',
      onClick: () => changeLanguage('es'),
    },
    {
      key: 'en',
      label: '🇺🇸 English',
      onClick: () => changeLanguage('en'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} className="uppercase font-semibold">
        {i18n.language?.substring(0, 2) || 'ES'}
      </Button>
    </Dropdown>
  );
}
