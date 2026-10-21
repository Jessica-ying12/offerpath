import { isValidElement, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { Check, Copy } from "lucide-react";
import { useStore } from "../lib/store";

type NodeWithPosition = {
  position?: { start: { line: number } };
};

function resolveLink(href: string | undefined): { to: string; external: boolean } | null {
  if (!href) return null;
  if (/^https?:\/\//.test(href)) return { to: href, external: true };
  if (href.startsWith("#")) return null;
  if (/面试问答\//.test(href)) {
    const match = href.match(/(\d{2})-/);
    if (match) return { to: `/qa/${match[1]}`, external: false };
  }
  if (/\.md(?:#.*)?$/.test(href)) {
    const match = href.match(/(\d{2})-/);
    if (match) return { to: `/doc/${match[1]}`, external: false };
  }
  return null;
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  let language = "";
  if (isValidElement(children)) {
    const className = (children.props as { className?: string }).className ?? "";
    language = className.match(/language-([\w-]+)/)?.[1] ?? "";
  }
  const copy = async () => {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="code-wrap">
      <button type="button" className="code-copy" onClick={copy} aria-label="复制代码">
        {copied ? <Check className="inline h-3 w-3" /> : <Copy className="inline h-3 w-3" />}
      </button>
      <pre ref={ref} data-language={language || undefined}>
        {children}
      </pre>
    </div>
  );
}

function TaskCheckbox({
  node,
  checked,
  interactive,
  docId,
}: {
  node?: NodeWithPosition;
  checked?: boolean;
  interactive: boolean;
  docId: string;
}) {
  const { state, toggleChecklist } = useStore();
  const line = node?.position?.start.line ?? 0;
  const key = `${docId}:${line}`;
  const value = state.checklists[key] ?? Boolean(checked);
  return (
    <input
      type="checkbox"
      checked={value}
      disabled={!interactive}
      onChange={(event) => toggleChecklist(key, event.target.checked)}
    />
  );
}

export function MarkdownView({
  markdown,
  docId,
  interactive = true,
  className = "",
}: {
  markdown: string;
  docId: string;
  interactive?: boolean;
  className?: string;
}) {
  const components = {
    h2: ({ id, children }: { id?: string; children?: ReactNode }) => (
      <h2 id={id}>
        {children}
        {id ? (
          <button
            type="button"
            className="heading-anchor"
            aria-label="跳到此节"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          >
            #
          </button>
        ) : null}
      </h2>
    ),
    h3: ({ id, children }: { id?: string; children?: ReactNode }) => (
      <h3 id={id}>
        {children}
        {id ? (
          <button
            type="button"
            className="heading-anchor"
            aria-label="跳到此节"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          >
            #
          </button>
        ) : null}
      </h3>
    ),
    pre: ({ children }: { children?: ReactNode }) => <CodeBlock>{children}</CodeBlock>,
    table: ({ children }: { children?: ReactNode }) => (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    ),
    input: (props: { node?: NodeWithPosition; checked?: boolean }) => (
      <TaskCheckbox node={props.node} checked={props.checked} interactive={interactive} docId={docId} />
    ),
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      const resolved = resolveLink(href);
      if (resolved?.external) {
        return (
          <a href={resolved.to} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        );
      }
      if (resolved) return <Link to={resolved.to}>{children}</Link>;
      return <a href={href}>{children}</a>;
    },
  } as Components;

  return (
    <div className={`prose-deep ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
