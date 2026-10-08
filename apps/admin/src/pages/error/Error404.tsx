import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Error404() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="404"
        title="404"
        subTitle={t('global.title404')}
        extra={
          <Link to="/">
            <Button type="primary">{t('global.backHome')}</Button>
          </Link>
        }
      />
    </div>
  );
}
