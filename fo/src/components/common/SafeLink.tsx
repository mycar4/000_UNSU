import React from 'react';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const SafeLink: React.FC<SafeLinkProps> = ({ href, children, ...props }) => {
  const validateAndCleanUrl = (rawUrl: string): string => {
    try {
      // If it's a relative URL or custom protocol without host, use absolute URL constructor helper
      let urlToCheck = rawUrl;
      if (!rawUrl.includes('://')) {
        // Appending dummy protocol to test relative path or use standard URL resolver
        const resolved = new URL(rawUrl, window.location.origin);
        urlToCheck = resolved.href;
      }

      const parsed = new URL(urlToCheck);
      
      // Whitelist http, https, and navigation intent protocols (tmap, kakaonavi)
      const allowedProtocols = ['http:', 'https:', 'tmap:', 'kakaonavi:'];
      if (allowedProtocols.includes(parsed.protocol)) {
        return rawUrl;
      }
      throw new Error('Invalid protocol requested');
    } catch (e) {
      console.error('Security Violation: Rejected unverified URL parsing', e);
      return '#'; // Safe fallback
    }
  };

  const safeHref = validateAndCleanUrl(href);

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};
