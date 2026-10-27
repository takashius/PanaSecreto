import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Spin } from 'antd';
import { Link } from 'react-router-dom';
import TermsSection from '@components/legal/TermsSection';
import MarkdownBody from '@components/legal/MarkdownBody';
import { usePublicLegal, type LegalDocKey } from '@api/legal';

type Props = {
  docKey: LegalDocKey;
  subtitleKey: string;
};

const LegalPublicDocumentPage = ({ docKey, subtitleKey }: Props) => {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, refetch, isFetching } = usePublicLegal(docKey, i18n.language);

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        message={t('legal.loadError')}
        action={
          <Button loading={isFetching} onClick={() => void refetch()}>
            {t('error.retry')}
          </Button>
        }
      />
    );
  }

  const updatedAt = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString()
    : t('legal.lastUpdatedFallback');

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-800 dark:text-gray-100 md:text-4xl">{data.title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">{t(subtitleKey)}</p>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-gray-200">
          <strong>{t('legal.lastUpdated')}:</strong> {updatedAt}
          {' · '}
          {t('legal.version', { version: data.version })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Card className="mb-8" size="small">
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{t('legal.tableOfContents')}</h2>
              <nav>
                <ul className="space-y-1">
                  {data.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block py-1 text-sm text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-400"
                      >
                        {section.title || section.id}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-3">
          {data.sections.map((section) => (
            <TermsSection key={section.id} title={section.title} id={section.id}>
              <MarkdownBody text={section.body} />
            </TermsSection>
          ))}

          {docKey === 'terms' ? (
            <Alert
              className="mt-4"
              type="info"
              showIcon
              message={t('legal.cancellationHintTitle')}
              description={
                <span>
                  {t('legal.cancellationHint')}{' '}
                  <Link to="/baja-servicio" className="font-medium text-amber-700 hover:underline dark:text-amber-400">
                    {t('legal.cancellation')}
                  </Link>
                  .
                </span>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LegalPublicDocumentPage;
