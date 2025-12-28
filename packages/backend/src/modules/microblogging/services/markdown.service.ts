import { Injectable } from '@nestjs/common';
import MarkdownIt from 'markdown-it';
import { FilterXSS, IFilterXSSOptions } from 'xss';

@Injectable()
export class MarkdownService {
  private md: MarkdownIt;
  private xssFilter: FilterXSS;

  constructor() {
    this.md = new MarkdownIt({
      html: false, // Disable raw HTML for security
      linkify: true, // Auto-detect URLs
      breaks: true, // Convert \n to <br>
    });

    const xssOptions: IFilterXSSOptions = {
      whiteList: {
        // Text formatting
        p: [],
        br: [],
        strong: [],
        b: [],
        em: [],
        i: [],

        // Links with safe attributes
        a: ['href', 'rel', 'target'],

        // Code
        code: ['class'],
        pre: [],

        // Lists
        ul: [],
        ol: [],
        li: [],

        // Quotes
        blockquote: [],

        // Headings (included for completeness)
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],

        // Horizontal rule
        hr: [],
      },
      onTagAttr: (tag, name, value) => {
        // Ensure links are safe
        if (tag === 'a' && name === 'href') {
          // Only allow safe protocols
          if (
            !value.startsWith('http://') &&
            !value.startsWith('https://') &&
            !value.startsWith('mailto:')
          ) {
            return ''; // Remove unsafe protocols
          }
        }
        return undefined; // Use default handling
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    };

    this.xssFilter = new FilterXSS(xssOptions);
  }

  /**
   * Render markdown to sanitized HTML
   */
  render(markdown: string): string {
    if (!markdown) {
      return '';
    }

    const html = this.md.render(markdown);
    return this.sanitize(html);
  }

  /**
   * Sanitize HTML content (for incoming federated content)
   */
  sanitize(html: string): string {
    if (!html) {
      return '';
    }

    let sanitized = this.xssFilter.process(html);

    // Add rel="nofollow noopener" and target="_blank" to external links
    sanitized = sanitized.replace(
      /<a\s+href="(https?:\/\/[^"]+)"([^>]*)>/g,
      '<a href="$1" rel="nofollow noopener" target="_blank"$2>',
    );

    return sanitized;
  }

  /**
   * Escape HTML special characters for plain text content
   */
  escapeHtml(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }
}
