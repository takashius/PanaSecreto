export type LegalSection = {
  id: string;
  title: string;
  body: string;
};

function slugify(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'seccion'
  );
}

export function parseMarkdownSections(markdown: string): LegalSection[] {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const sections: LegalSection[] = [];
  let current: { title: string; lines: string[] } | null = null;

  const pushCurrent = () => {
    if (!current) return;
    const body = current.lines.join('\n').trim();
    if (!current.title && !body) return;
    sections.push({
      id: slugify(current.title || `seccion-${sections.length + 1}`),
      title: current.title,
      body,
    });
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      pushCurrent();
      current = { title: heading[1].trim(), lines: [] };
      continue;
    }
    if (!current) {
      if (line.startsWith('# ')) continue;
      if (!line.trim()) continue;
      current = { title: '', lines: [line] };
      continue;
    }
    current.lines.push(line);
  }
  pushCurrent();
  return sections.filter((item) => item.title || item.body);
}

export function documentToMarkdown(title: string, intro: string, sections: { title: string; body: string }[]): string {
  const parts = [`# ${title}`, '', intro.trim(), ''];
  for (const s of sections) {
    parts.push(`## ${s.title}`, '', s.body.trim(), '');
  }
  return parts.join('\n').trim();
}
