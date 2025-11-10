import React, { useState, useEffect } from 'react';
import type { GeneratedFiles } from '../types';
import { CppIcon, JsonIcon, TxtIcon, GithubIcon, GitignoreIcon, MarkdownIcon, SparklesIcon, LoadingIcon } from './IconComponents';

interface FilePreviewProps {
    files: GeneratedFiles | null;
    aiEnabled: boolean;
    onExplainCode: (code: string, fileName: string) => void;
    isExplainingCode: boolean;
    codeExplanation: string;
    onClearExplanation: () => void;
    aiError: string;
}

type Tab = keyof GeneratedFiles;

const FilePreview: React.FC<FilePreviewProps> = ({ files, aiEnabled, onExplainCode, isExplainingCode, codeExplanation, onClearExplanation, aiError }) => {
    const [activeTab, setActiveTab] = useState<Tab>('mod.json');

    useEffect(() => {
        // If the current active tab file is removed (e.g. unchecking CI),
        // switch back to a default tab.
        if (files && !files[activeTab]) {
            setActiveTab('mod.json');
        }
        // Clear explanation when tab changes
        onClearExplanation();
    }, [files, activeTab]);

    if (!files) {
        return (
            <div className="bg-geode-mantle p-6 rounded-lg shadow-lg border border-geode-surface flex items-center justify-center h-full">
                <p className="text-geode-overlay">Fill out the form to see a live preview of your mod files.</p>
            </div>
        );
    }
    
    const allTabs: { key: Tab, label: string, icon: React.ReactNode }[] = [
        { key: 'mod.json', label: 'mod.json', icon: <JsonIcon className="h-5 w-5" /> },
        { key: 'README.md', label: 'README.md', icon: <MarkdownIcon className="h-5 w-5" /> },
        { key: 'CMakeLists.txt', label: 'CMakeLists', icon: <TxtIcon className="h-5 w-5" /> },
        { key: 'src/main.cpp', label: 'src/main.cpp', icon: <CppIcon className="h-5 w-5" /> },
        { key: '.gitignore', label: '.gitignore', icon: <GitignoreIcon className="h-5 w-5" /> },
        { key: '.github/workflows/main.yml', label: 'CI Workflow', icon: <GithubIcon className="h-5 w-5" /> },
    ];
    
    const availableTabs = allTabs.filter(tab => files[tab.key]);
    
    const handleExplainClick = () => {
        const fileContent = files[activeTab];
        if(fileContent) {
            onExplainCode(fileContent, activeTab);
        }
    }

    return (
        <div className="bg-geode-mantle rounded-lg shadow-lg border border-geode-surface overflow-hidden h-full flex flex-col">
            <div className="flex border-b border-geode-surface bg-geode-crust flex-wrap">
                {availableTabs.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === key
                                ? 'bg-geode-mantle text-geode-teal border-b-2 border-geode-teal'
                                : 'text-geode-overlay hover:bg-geode-surface/50'
                        }`}
                        aria-current={activeTab === key ? 'page' : undefined}
                    >
                        {icon}
                        <span>{label}</span>
                    </button>
                ))}
            </div>
            <div className="p-1 flex-grow overflow-auto bg-geode-crust relative">
                 <pre className="text-sm text-geode-light h-full w-full">
                     <code className="p-4 block h-full w-full overflow-auto rounded-b-md">
                        {files[activeTab]}
                     </code>
                 </pre>
            </div>
             <div className="border-t border-geode-surface bg-geode-crust p-3">
                 {codeExplanation ? (
                     <div className="bg-geode-crust p-3 rounded-md max-h-64 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-geode-teal flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5"/>
                                AI Explanation
                            </h3>
                            <button onClick={onClearExplanation} className="text-geode-overlay hover:text-geode-light">&times;</button>
                        </div>
                        <div className="text-geode-light text-sm prose" style={{whiteSpace: 'pre-wrap'}}>{codeExplanation}</div>
                     </div>
                 ) : (
                    <button onClick={handleExplainClick} disabled={!aiEnabled || isExplainingCode} className="w-full flex items-center justify-center gap-2 bg-geode-blue/20 text-geode-blue font-bold py-2 px-4 rounded-md hover:bg-geode-blue/30 transition-all disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed">
                       {isExplainingCode ? <LoadingIcon className="animate-spin h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                       {isExplainingCode ? 'Thinking...' : 'Explain This Code'}
                    </button>
                 )}
                  {aiError && !codeExplanation && <p className="text-xs text-geode-red text-center mt-2">{aiError}</p>}
             </div>
        </div>
    );
};

export default FilePreview;