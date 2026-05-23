import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { type ExportOptions, type ExtractedPage, type MarkdownConversionResult } from './types';

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function hasAttribute(node: Node, attributeName: string): node is Element {
  return isElement(node) && node.hasAttribute(attributeName);
}

function normalizeRelativeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, href: string) => {
    return `href="${new URL(href, pageUrl).toString()}"`;
  });
}

function normalizeTablesForMarkdown(html: string): string {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');

  parsed.querySelectorAll('table').forEach((table) => {
    const simplifiedTable = parsed.createElement('table');
    const simplifiedBody = parsed.createElement('tbody');

    table.querySelectorAll('tr').forEach((row) => {
      const simplifiedRow = parsed.createElement('tr');

      row.querySelectorAll(':scope > th, :scope > td').forEach((cell) => {
        const simplifiedCell = parsed.createElement(cell.tagName.toLowerCase());
        const sanitizedCell = cell.cloneNode(true) as HTMLElement;

        sanitizedCell.querySelectorAll(
          'figure, [role="button"], [role="presentation"], .ak-renderer-tableHeader-sorting-icon__wrapper, .ak-renderer-tableHeader-sorting-icon, colgroup'
        ).forEach((node) => node.remove());

        let changed = true;
        while (changed) {
          changed = false;
          Array.from(sanitizedCell.querySelectorAll('*')).reverse().forEach((element) => {
            const tag = element.tagName;

            if (tag === 'A') {
              Array.from(element.attributes).forEach((attribute) => {
                if (attribute.name !== 'href') {
                  element.removeAttribute(attribute.name);
                }
              });
              return;
            }

            if (tag === 'STRONG' || tag === 'EM' || tag === 'CODE') {
              Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
              return;
            }

            if (tag === 'BR') {
              element.replaceWith(parsed.createTextNode(' '));
              changed = true;
              return;
            }

            const fragment = parsed.createDocumentFragment();
            while (element.firstChild) {
              fragment.appendChild(element.firstChild);
            }
            element.replaceWith(fragment);
            changed = true;
          });
        }

        sanitizedCell.normalize();
        Array.from(sanitizedCell.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent?.replace(/\s+/g, ' ') ?? '';
          }
        });

        simplifiedCell.innerHTML = sanitizedCell.innerHTML.trim();
        simplifiedRow.appendChild(simplifiedCell);
      });

      if (simplifiedRow.children.length > 0) {
        simplifiedBody.appendChild(simplifiedRow);
      }
    });

    simplifiedTable.appendChild(simplifiedBody);
    table.replaceWith(simplifiedTable);
  });

  return parsed.body.innerHTML;
}

function createTurndownService(warnings: MarkdownConversionResult['warnings']): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  service.use(gfm);

  service.addRule('panel', {
    filter: (node) => hasAttribute(node, 'data-panel-type'),
    replacement: (content, node) => {
      const label = (node as HTMLElement).getAttribute('data-panel-type')?.trim() || 'info';
      return `\n> **${label[0].toUpperCase()}${label.slice(1)}:** ${content.trim()}\n`;
    }
  });

  service.addRule('status', {
    filter: (node) => isElement(node) && node.getAttribute('data-testid') === 'status-lozenge',
    replacement: (_content, node) => `[Status: ${(node as HTMLElement).textContent?.trim() || ''}]`
  });

  service.addRule('task-list', {
    filter: (node) => isElement(node) && node.tagName === 'LI' && node.parentElement?.getAttribute('data-task-list') === 'true',
    replacement: (_content, node) => {
      const checkbox = node.querySelector('input[type="checkbox"]');
      const checked = isElement(checkbox) && checkbox.tagName === 'INPUT' && 'checked' in checkbox && Boolean(checkbox.checked);
      const text = Array.from(node.childNodes)
        .filter((child) => child.nodeName !== 'INPUT')
        .map((child) => child.textContent || '')
        .join('')
        .trim();
      return `\n- [${checked ? 'x' : ' '}] ${text}`;
    }
  });

  service.addRule('unsupported-macro', {
    filter: (node) => hasAttribute(node, 'data-macro-name'),
    replacement: () => ''
  });

  return service;
}

export function convertExtractedPageToMarkdown(
  page: ExtractedPage,
  options: ExportOptions = { tableFormat: 'markdown' }
): MarkdownConversionResult {
  const warnings: MarkdownConversionResult['warnings'] = [];
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const turndown = createTurndownService(warnings);
  const body = turndown.turndown(normalizeTablesForMarkdown(normalizedHtml)).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings
  };
}
