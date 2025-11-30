/**
 * WikiContent component that renders markdown with wiki link support
 * Converts [PageTitle] to clickable links
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import type { Components } from 'react-markdown';

interface WikiContentProps {
    content: string;
}

interface WikiLink {
    title: string;
    exists: boolean;
    pageId?: string;
}

export function WikiContent({ content }: WikiContentProps) {
    const [wikiLinks, setWikiLinks] = useState<Map<string, WikiLink>>(new Map());
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        processWikiLinks();
    }, [content]);

    const processWikiLinks = async () => {
        setIsProcessing(true);

        // Find all wiki links in the format [PageTitle] (but not [text](url))
        const wikiLinkPattern = /\[([^\]]+)\](?!\()/g;
        const matches = [...content.matchAll(wikiLinkPattern)];

        if (matches.length === 0) {
            setIsProcessing(false);
            return;
        }

        const linkMap = new Map<string, WikiLink>();

        // Check each wiki link to see if the page exists
        for (const match of matches) {
            const pageTitle = match[1];

            // Skip if already processed
            if (linkMap.has(pageTitle)) continue;

            const page = await api.getPageByTitle(pageTitle);

            if (page) {
                linkMap.set(pageTitle, {
                    title: pageTitle,
                    exists: true,
                    pageId: page.id,
                });
            } else {
                linkMap.set(pageTitle, {
                    title: pageTitle,
                    exists: false,
                });
            }
        }

        setWikiLinks(linkMap);
        setIsProcessing(false);
    };

    // Process content to convert wiki links to markdown links
    const processContent = (text: string): string => {
        let processed = text;

        wikiLinks.forEach((link, title) => {
            // Escape special regex characters in title
            const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Match [PageTitle] but not [text](url)
            const regex = new RegExp(`\\[${escapedTitle}\\](?!\\()`, 'g');

            if (link.exists && link.pageId) {
                // Convert to internal link with special marker
                processed = processed.replace(regex, `[${title}](#/page/${link.pageId})`);
            } else {
                // Keep as is but we'll style it differently
                processed = processed.replace(regex, `[${title}](#missing:${title})`);
            }
        });

        return processed;
    };

    const components: Components = {
        a: ({ href, children, ...props }) => {
            // Handle wiki links
            if (href?.startsWith('#/page/')) {
                const pageId = href.replace('#/page/', '');
                return (
                    <Link
                        to={`/page/${pageId}`}
                        className="wiki-link wiki-link-exists"
                        {...props}
                    >
                        {children}
                    </Link>
                );
            } else if (href?.startsWith('#missing:')) {
                const title = href.replace('#missing:', '');
                return (
                    <span
                        className="wiki-link wiki-link-missing"
                        title={`Page "${title}" does not exist`}
                        {...props}
                    >
                        {children}
                    </span>
                );
            }

            // Regular external links
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                </a>
            );
        },
    };

    if (isProcessing) {
        return (
            <div className="markdown-content">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="markdown-content">
            <ReactMarkdown components={components}>
                {processContent(content)}
            </ReactMarkdown>
        </div>
    );
}
