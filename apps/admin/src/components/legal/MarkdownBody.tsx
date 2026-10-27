import type { ReactNode } from 'react';

const renderInline = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

type MarkdownBodyProps = {
  text: string;
};

const MarkdownBody = ({ text }: MarkdownBodyProps) => {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        const isList = lines.every((line) => line.trim().startsWith('- '));
        if (isList) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*-\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.replace(/\n/g, ' '))}</p>;
      })}
    </>
  );
};

export default MarkdownBody;
