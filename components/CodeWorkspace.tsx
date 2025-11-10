import React, { useState, useEffect } from 'react';
import type { GeneratedFiles } from '../types';
import FileExplorer from './FileExplorer';
import { SparklesIcon, LoadingIcon, InfoIcon, PlayIcon } from './IconComponents';

interface CodeWorkspaceProps {
    files: GeneratedFiles | null;
    onFileContentChange: (path: string, newContent: string) => void;
    // AI Props
    aiEnabled: boolean;
    onAskGigiToExplain: (fileName: string) => void;
    isChatting: boolean;
    onRunMod: () => void;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute right-0 bottom-full mb-2 w-max max-w-xs bg-geode-crust border border-geode-surface text-center text-sm text-geode-light rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {text}
        </div>
    </div>
);

const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ files, onFileContentChange, aiEnabled, onAskGigiToExplain, isChatting, onRunMod }) => {
    const [selectedFile, setSelectedFile] = useState<string>('');
    
    useEffect(() => {
        if (files) {
            const fileList = Object.keys(files);
            // If no file is selected, or the selected file no longer exists, select the first available file.
            if (!selectedFile || !files[selectedFile]) {
                setSelectedFile(fileList.includes('mod.json') ? 'mod.json' : fileList[0] || '');
            }
        }
    }, [files, selectedFile]);

    if (!files || !selectedFile) {
        return (
            <div className="bg-geode-mantle p-6 rounded-lg shadow-lg border border-geode-surface flex items-center justify-center h-full min-h-[400px]">
                <p className="text-geode-overlay">Fill out the form to see a live preview of your mod files.</p>
            </div>
        );
    }

    const currentFileContent = files[selectedFile] ?? '';
    const isImageFile = selectedFile.endsWith('.png');

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onFileContentChange(selectedFile, e.target.value);
    }
    
    return (
        <div className="bg-geode-mantle rounded-lg shadow-lg border border-geode-surface overflow-hidden h-full flex min-h-[400px]">
            <div className="w-1/3 max-w-xs border-r border-geode-surface flex flex-col">
                <FileExplorer 
                    files={files} 
                    selectedFile={selectedFile} 
                    onFileSelect={(file) => setSelectedFile(file)}
                />
            </div>
            <div className="w-2/3 flex flex-col">
                 <div className="flex justify-between items-center p-3 border-b border-geode-surface bg-geode-crust">
                    <h3 className="font-mono text-sm text-geode-light">{selectedFile}</h3>
                     <div className="flex items-center gap-4">
                        <button 
                            onClick={onRunMod}
                            className="flex items-center gap-1.5 text-sm text-geode-green hover:text-opacity-80 transition-colors"
                            aria-label="How to run mod"
                        >
                            <PlayIcon className="h-4 w-4" />
                            Run Mod
                        </button>
                        {!isImageFile && (
                            <Tooltip text="Note: Manual edits will be discarded if you change any settings in the form on the left.">
                                <InfoIcon className="h-4 w-4 text-geode-overlay" />
                            </Tooltip>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-geode-crust relative">
                    {isImageFile ? (
                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <img 
                                src={`data:image/png;base64,${currentFileContent}`} 
                                alt={selectedFile}
                                className="max-w-full max-h-full object-contain border border-geode-surface rounded-md"
                            />
                        </div>
                    ) : (
                        <textarea
                            value={currentFileContent}
                            onChange={handleContentChange}
                            className="w-full h-full p-4 bg-transparent text-sm text-geode-light font-mono resize-none border-none outline-none leading-relaxed"
                            spellCheck="false"
                        />
                    )}
                </div>
                <div className="border-t border-geode-surface bg-geode-crust p-3">
                    <button 
                        onClick={() => onAskGigiToExplain(selectedFile)} 
                        disabled={!aiEnabled || isChatting || isImageFile} 
                        className="w-full flex items-center justify-center gap-2 bg-geode-blue/20 text-geode-blue font-bold py-2 px-4 rounded-md hover:bg-geode-blue/30 transition-all disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed"
                    >
                       {isChatting ? <LoadingIcon className="animate-spin h-5 w-5" /> : <SparklesIcon className="h-5 w-s5" />}
                       {isImageFile ? 'Ask about text files' : (isChatting ? 'Gigi is thinking...' : 'Ask Gigi to Explain This File')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CodeWorkspace;