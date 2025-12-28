import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css' // Import highlight.js styles

const MarkdownRenderer = ({ content, className = '' }) => {
    // Pre-process content to handle \n characters
    const processedContent = content
        ?.replace(/\\n/g, '\n')  // Convert \n strings to actual newlines
        ?.replace(/\n/g, '  \n')  // Add double space before newlines for markdown line breaks
    
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom styling for different markdown elements
                    h1: ({ children }) => (
                        <h1 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            color: '#1f2937'
                        }}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            marginBottom: '6px',
                            color: '#374151'
                        }}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            marginBottom: '4px',
                            color: '#4b5563'
                        }}>
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p style={{ 
                            margin: '4px 0',
                            lineHeight: '1.4',
                            fontSize: '13px'
                        }}>
                            {children}
                        </p>
                    ),
                    strong: ({ children }) => (
                        <strong style={{ 
                            fontWeight: '600',
                            color: '#1f2937'
                        }}>
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em style={{ 
                            fontStyle: 'italic',
                            color: '#4b5563'
                        }}>
                            {children}
                        </em>
                    ),
                    code: ({ node, inline, children }) => (
                        inline ? (
                            <code style={{
                                backgroundColor: '#f3f4f6',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                color: '#e11d48'
                            }}>
                                {children}
                            </code>
                        ) : (
                            <pre style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '8px',
                                margin: '8px 0',
                                fontSize: '12px',
                                overflow: 'auto',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                            }}>
                                <code>{children}</code>
                            </pre>
                        )
                    ),
                    ul: ({ children }) => (
                        <ul style={{ 
                            paddingLeft: '16px',
                            margin: '4px 0',
                            fontSize: '13px'
                        }}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol style={{ 
                            paddingLeft: '16px',
                            margin: '4px 0',
                            fontSize: '13px'
                        }}>
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li style={{ 
                            marginBottom: '2px',
                            lineHeight: '1.4'
                        }}>
                            {children}
                        </li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote style={{
                            borderLeft: '4px solid #e2e8f0',
                            paddingLeft: '12px',
                            margin: '8px 0',
                            fontStyle: 'italic',
                            color: '#6b7280',
                            backgroundColor: '#f9fafb',
                            padding: '8px 12px',
                            borderRadius: '0 4px 4px 0'
                        }}>
                            {children}
                        </blockquote>
                    ),
                    table: ({ children }) => (
                        <div style={{ overflow: 'auto', margin: '8px 0' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th style={{
                            backgroundColor: '#f8fafc',
                            padding: '6px 8px',
                            border: '1px solid #e2e8f0',
                            fontWeight: '600',
                            textAlign: 'left'
                        }}>
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td style={{
                            padding: '6px 8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            {children}
                        </td>
                    ),
                    a: ({ href, children }) => (
                        <a 
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#2563eb',
                                textDecoration: 'underline'
                            }}
                        >
                            {children}
                        </a>
                    )
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}

export default MarkdownRenderer