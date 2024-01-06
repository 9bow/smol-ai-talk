import React, {
  ReactElement,
  ReactNode,
  createContext,
  useContext
} from 'react'

/** Local context for code blocks (when <pre> is a parent of <code>) */
const CodeBlockContext = createContext<boolean>(false)
/** Local context for list items with erroneously added paragraph tags */
const ListItemContext = createContext<boolean>(false)

type MarkdownComponentProps = {
  node?: ReactNode
  children?: ReactNode
}

/**
 * Custom component for the `<code>` element
 * This component uses the CodeBlockContext to determine if it is within a `<pre>` tag,
 * indicating that it is a code block.
 * - If so, it adds no custom styling allowing the `<pre>` tag to handle it.
 * - If not, it adds custom styling to make it look like an inline code block.
 */
const Code: React.FC<MarkdownComponentProps> = ({ children }) => {
  const isInCodeBlock = useContext(CodeBlockContext)
  const className = !isInCodeBlock
    ? 'text-xs bg-gray-200 rounded px-1 text-pink-600 font-semibold overflow-x-auto'
    : ''

  return <code className={className}>{children}</code>
}

/**
 * Custom component for the `<pre>` element
 * This component determines if it has a child `<code>` element, indicating that it is a code block,
 * and sets the CodeBlockContext accordingly. It then applies custom styling to make it look like a code block.
 */
const Pre: React.FC<MarkdownComponentProps> = ({ children }) => {
  const hasCodeBlock = React.Children.toArray(children).some(child => {
    const child_ = child as ReactElement
    return React.isValidElement(child) && child_.props.node.tagName === 'code'
  })

  return (
    <CodeBlockContext.Provider value={hasCodeBlock}>
      <pre className={`w-full rounded bg-slate-700 p-4 text-xs text-white`}>
        {children}
      </pre>
    </CodeBlockContext.Provider>
  )
}

/**
 * Custom component for the `<p>` element
 * This component determines if it is within a `<li>` tag, indicating that it is a list item.
 * - If so, it adds no custom styling and removes the `<p>` tag allowing the `<li>` tag to handle it.
 * - If not, it adds custom styling to make it look like a paragraph.
 */
const Paragraph: React.FC<MarkdownComponentProps> = ({ children }) => {
  const isInListItem = useContext(ListItemContext)

  // If inside <li>, just render children without <p> wrapper
  if (isInListItem) return <>{children}</>

  return (
    <p className="mb-4 text-sm leading-6 text-gray-700 dark:text-gray-200">
      {children}
    </p>
  )
}

/** Custom component for the `<li>` element */
const ListItem: React.FC<MarkdownComponentProps> = ({ children }) => (
  <ListItemContext.Provider value={true}>
    <li className="mb-2 flex items-start">
      <span className="mr-2 text-sm text-gray-700 dark:text-gray-200">•</span>
      <span className="text-sm text-gray-700 dark:text-gray-200">
        {children}
      </span>
    </li>
  </ListItemContext.Provider>
)

const Link: React.FC<MarkdownComponentProps & { href?: string }> = ({
  children,
  href
}) => (
  <a
    href={href}
    className="text-blue-500 hover:underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
)

/**
 * Markdown to HTML Conversion for React Markdown
 */
export const MarkdownComponents: Record<
  string,
  React.FC<MarkdownComponentProps>
> = {
  // Headers
  h1: ({ children }) => <h1 className="my-4 text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="my-3 text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-lg font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-md my-2 font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="my-2 text-sm font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="my-1 text-xs font-bold">{children}</h6>,

  // Text
  p: Paragraph,

  span: ({ children }) => (
    <span className="text-sm text-gray-700 dark:text-gray-200">{children}</span>
  ),

  // Lists
  ul: ({ children }) => <ul className="list-none pb-2 pl-4">{children}</ul>,
  ol: ({ children }) => (
    <ol className='list-decimal pl-4'>{children}</ol>
  ),
  // ol: ({ children }) => <ol className="list-decimal pb-2 pl-4">{children}</ol>,
  li: ListItem,

  // Code
  code: Code,
  pre: Pre,

  // Links
  a: Link,

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-gray-400 pl-4 italic">
      {children}
    </blockquote>
  ),

  // Images
  img: ({ children }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className="my-2 h-auto max-w-full">{children}</img>
  ),

  // Tables
  table: ({ children }) => (
    <table className="w-full table-auto">{children}</table>
  ),
  thead: ({ children }) => <thead className="bg-gray-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="bg-gray-100">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-gray-300">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-2">{children}</td>
}
