import { useEffect, useMemo, useState, type DragEvent } from 'react';

type BlockType = 'text' | 'heading' | 'button';
type Block = { id: string; type: BlockType; value: string };

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => HTML_ENTITIES[character]);

export default function EmailTemplateBuilder({ onChange }: { onChange: (html: string) => void }) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const add = (type: BlockType) => {
    const value = type === 'heading' ? 'Heading' : type === 'button' ? 'Click here' : 'Write your message';
    setBlocks(current => [...current, { id: crypto.randomUUID(), type, value }]);
  };

  const update = (id: string, value: string) => {
    setBlocks(current => current.map(block => block.id === id ? { ...block, value } : block));
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setBlocks(current => {
      if (from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const html = useMemo(() => blocks.map(block => {
    const value = escapeHtml(block.value);
    if (block.type === 'heading') return `<h1>${value}</h1>`;
    if (block.type === 'button') return `<a href="{{link}}">${value}</a>`;
    return `<p>${value}</p>`;
  }).join(''), [blocks]);

  useEffect(() => onChange(html), [html, onChange]);

  const startDrag = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => add('heading')}>+ Heading</button>
        <button type="button" onClick={() => add('text')}>+ Text</button>
        <button type="button" onClick={() => add('button')}>+ Button</button>
      </div>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable
          onDragStart={event => startDrag(event, index)}
          onDragOver={event => event.preventDefault()}
          onDrop={event => move(Number(event.dataTransfer.getData('text/plain')), index)}
          className="border p-2 bg-gray-50 cursor-move"
        >
          <input
            className="w-full border rounded p-1"
            value={block.value}
            onChange={event => update(block.id, event.target.value)}
            aria-label={`${block.type} block`}
          />
          <button type="button" className="text-xs text-red-600" onClick={() => setBlocks(current => current.filter(item => item.id !== block.id))}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
