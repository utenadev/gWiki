/**
 * Version history component showing page revisions
 */

import { useState } from 'react';
import { diffLines, Change } from 'diff';
import type { PageVersion } from '../types';

interface VersionHistoryProps {
    versions: PageVersion[];
    currentContent: string;
}

export function VersionHistory({ versions, currentContent }: VersionHistoryProps) {
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const [showDiff, setShowDiff] = useState(false);

    if (!versions || versions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                まだ履歴がありません
            </div>
        );
    }

    const getVersionContent = (versionNumber: number): string => {
        if (versionNumber === 0) return currentContent;
        const version = versions.find(v => v.versionNumber === versionNumber);
        return version?.content || '';
    };

    const renderDiff = (oldContent: string, newContent: string) => {
        const changes: Change[] = diffLines(oldContent, newContent);

        return (
            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                {changes.map((change, index) => {
                    let className = 'whitespace-pre-wrap';
                    let prefix = ' ';

                    if (change.added) {
                        className += ' bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                        prefix = '+';
                    } else if (change.removed) {
                        className += ' bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
                        prefix = '-';
                    }

                    return (
                        <div key={index} className={className}>
                            {change.value.split('\n').map((line, lineIndex) => (
                                <div key={lineIndex}>
                                    {line && <span className="select-none mr-2 opacity-50">{prefix}</span>}
                                    {line}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    📜 バージョン履歴
                </h3>
                {selectedVersion !== null && (
                    <button
                        onClick={() => setShowDiff(!showDiff)}
                        className="btn-secondary text-sm"
                    >
                        {showDiff ? '📄 内容を表示' : '🔍 差分を表示'}
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {/* Current version */}
                <div
                    onClick={() => {
                        setSelectedVersion(0);
                        setShowDiff(false);
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedVersion === 0
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-purple-600 dark:text-purple-400">
                                現在のバージョン
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                最新
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-semibold">
                            最新
                        </span>
                    </div>
                </div>

                {/* Previous versions */}
                {versions.map((version) => (
                    <div
                        key={version.versionNumber}
                        onClick={() => {
                            setSelectedVersion(version.versionNumber);
                            setShowDiff(false);
                        }}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedVersion === version.versionNumber
                                ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                    バージョン #{version.versionNumber}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(version.updatedAt).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content display */}
            {selectedVersion !== null && (
                <div className="mt-6">
                    {showDiff ? (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                差分表示
                            </h4>
                            {renderDiff(
                                getVersionContent(selectedVersion),
                                selectedVersion === 0
                                    ? getVersionContent(versions[0]?.versionNumber || 1)
                                    : currentContent
                            )}
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                {selectedVersion === 0 ? '現在の内容' : `バージョン #${selectedVersion} の内容`}
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                                    {getVersionContent(selectedVersion)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
