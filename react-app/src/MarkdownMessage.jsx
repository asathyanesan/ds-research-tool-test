import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => (
          <p className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-200" {...props} />
        ),
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-slate-50" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-bold mt-3 mb-2 text-slate-800 dark:text-slate-100" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold mt-3 mb-1 text-slate-800 dark:text-slate-100" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-sm font-semibold mt-2 mb-1 text-slate-700 dark:text-slate-200" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-outside ml-5 mb-2 space-y-1 text-slate-700 dark:text-slate-200" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 text-slate-700 dark:text-slate-200" {...props} />
        ),
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        strong: ({ node, ...props }) => (
          <strong className="font-semibold text-slate-900 dark:text-slate-50" {...props} />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-teal-300 dark:border-teal-500 pl-4 my-2 text-slate-600 dark:text-slate-300 italic"
            {...props}
          />
        ),
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code
              className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-sm font-mono"
              {...props}
            />
          ) : (
            <code
              className="block bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2 whitespace-pre-wrap"
              {...props}
            />
          ),
        pre: ({ node, ...props }) => <pre className="my-2" {...props} />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-teal-50 dark:bg-slate-800" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th
            className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-100 bg-teal-50 dark:bg-slate-800"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td
            className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-200"
            {...props}
          />
        ),
        tr: ({ node, ...props }) => (
          <tr
            className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-slate-700/50 transition-colors"
            {...props}
          />
        ),
        hr: ({ node, ...props }) => (
          <hr className="border-slate-200 dark:border-slate-700 my-3" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline underline-offset-2"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}