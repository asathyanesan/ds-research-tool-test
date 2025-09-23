import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownMessage({ content }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
