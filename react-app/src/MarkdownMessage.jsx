import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      components={{
        // Open all links in new tab with blue color and underline
        a: ({ node, ...props }) => (
          <a 
            {...props} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
