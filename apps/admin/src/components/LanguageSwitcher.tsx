import { useEffect } from 'react';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && languages.some((lang) => lang.code === savedLanguage)) {
      void i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageChange = (languageCode: string) => {
    void i18n.changeLanguage(languageCode);
    localStorage.setItem('preferred-language', languageCode);
  };

  return (
    <Select
      value={i18n.language?.startsWith('en') ? 'en' : 'es'}
      onChange={handleLanguageChange}
      className={`min-w-[110px] ${className}`}
      suffixIcon={<GlobalOutlined />}
      options={languages.map((language) => ({
        value: language.code,
        label: language.name,
      }))}
    />
  );
}
