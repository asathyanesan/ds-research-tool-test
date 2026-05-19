import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-gray-800" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-1 text-gray-800" {...props} />,
        h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-2 mb-1 text-gray-700" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-blue-300 pl-4 my-2 text-gray-600 italic" {...props} />
        ),
        code: ({ node, inline, ...props }) =>
          inline
            ? <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props} />
            : <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2 whitespace-pre-wrap" {...props} />,
        pre: ({ node, ...props }) => <pre className="my-2" {...props} />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-blue-50" {...props} />,
        th: ({ node, ...props }) => (
          <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 bg-blue-50" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-gray-200 px-3 py-2 text-gray-700" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="even:bg-gray-50 hover:bg-blue-50 transition-colors" {...props} />
        ),
        hr: ({ node, ...props }) => <hr className="border-gray-200 my-3" {...props} />,
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
