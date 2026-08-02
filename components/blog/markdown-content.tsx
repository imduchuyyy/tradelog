import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

function HTMLWidget({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-8 overflow-x-auto rounded-[6px] border border-border">
      {children}
    </div>
  );
}

const components = {
  htmlwidget: HTMLWidget,
} as unknown as Components;

export function BlogMarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
