import type { ReactNode } from "react";

// A deliberately small Markdown subset. React escapes every text segment;
// HTML, images and Markdown links are never interpreted or made clickable.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={index} className="rounded bg-background/70 px-1">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function ChatFormattedText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const list = line.match(/^\s*(?:([-*])|\d+[.)])\s+(.+)$/);
    if (list) {
      const ordered = !list[1], start = Number.parseInt(line.trim(), 10);
      const items: ReactNode[] = [];
      const pattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*]\s+(.+)$/;
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(<li key={index}>{inline(match[1])}</li>);
        index++;
      }
      blocks.push(ordered
        ? <ol key={`list-${index}`} start={start} className="my-2 list-decimal space-y-1 pl-5">{items}</ol>
        : <ul key={`list-${index}`} className="my-2 list-disc space-y-1 pl-5">{items}</ul>);
      continue;
    }
    // Headings are visual emphasis inside a message, preserving page hierarchy.
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    blocks.push(<div key={index} className="min-h-[1.5em] whitespace-pre-wrap break-words">{heading ? <strong>{inline(heading[1])}</strong> : inline(line)}</div>);
    index++;
  }
  return <div>{blocks}</div>;
}
