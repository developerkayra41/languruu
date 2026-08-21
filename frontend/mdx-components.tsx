import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-10 mb-4" {...props} />
    ),
    h2: (props) => (
      <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-3" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-2" {...props} />
    ),
    p: (props) => <p className="leading-8 text-gray-700 mb-5" {...props} />,
    ul: (props) => (
      <ul className="list-disc pl-6 mb-5 space-y-2 text-gray-700 leading-8" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-6 mb-5 space-y-2 text-gray-700 leading-8" {...props} />
    ),
    li: (props) => <li className="leading-8" {...props} />,
    strong: (props) => <strong className="font-semibold text-gray-900" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-6"
        {...props}
      />
    ),
    code: (props) => (
      <code className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-sm" {...props} />
    ),
    a: ({ href, ...props }) => {
      const target = href ?? "#";
      const isInternal = target.startsWith("/");
      return isInternal ? (
        <Link href={target} className="text-purple-600 underline hover:text-purple-700" {...props} />
      ) : (
        <a
          href={target}
          rel="noopener noreferrer"
          className="text-purple-600 underline hover:text-purple-700"
          {...props}
        />
      );
    },
    ...components,
  };
}
