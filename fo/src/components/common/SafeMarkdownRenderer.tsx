import React, { useMemo } from 'react';
// Note: In a real environment, you'd use a library like 'dompurify' and 'marked' or 'react-markdown'
// This is a stub implementation meeting the interface requirements without dangerouslySetInnerHTML.

interface SafeMarkdownRendererProps {
  content: string;
}

export function SafeMarkdownRenderer({ content }: SafeMarkdownRendererProps) {
  // 실무에서는 여기서 markdown 파싱 및 DOMPurify를 통해 살균 처리 후 렌더링합니다.
  // dangerouslySetInnerHTML 사용을 금지하였으므로, 텍스트 노드로만 안전하게 렌더링하거나 
  // 안전한 AST 기반 React 렌더러(예: react-markdown)를 사용해야 합니다.
  
  const safeLines = useMemo(() => {
    return content.split('\n').filter(line => line.trim().length > 0);
  }, [content]);

  return (
    <div className="space-y-4">
      {safeLines.map((line, index) => (
        <p key={index} className="text-xl font-medium leading-relaxed text-[#334155] dark:text-slate-300">
          {line}
        </p>
      ))}
    </div>
  );
}
