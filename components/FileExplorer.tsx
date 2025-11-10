import React from 'react';
import type { GeneratedFiles } from '../types';
import { CppIcon, JsonIcon, TxtIcon, GithubIcon, GitignoreIcon, MarkdownIcon, FolderIcon, FileIcon, ImageIcon } from './IconComponents';

interface FileExplorerProps {
    files: GeneratedFiles | null;
    selectedFile: string;
    onFileSelect: (file: string) => void;
}

const getIcon = (fileName: string) => {
    if (fileName.endsWith('.png')) return <ImageIcon className="h-4 w-4" />;
    if (fileName.endsWith('.json')) return <JsonIcon className="h-4 w-4" />;
    if (fileName.endsWith('.cpp')) return <CppIcon className="h-4 w-4" />;
    if (fileName.endsWith('.md')) return <MarkdownIcon className="h-4 w-4" />;
    if (fileName.endsWith('.yml')) return <GithubIcon className="h-4 w-4" />;
    if (fileName.endsWith('.plist')) return <TxtIcon className="h-4 w-4" />;
    if (fileName.includes('CMakeLists')) return <TxtIcon className="h-4 w-4" />;
    if (fileName.includes('.gitignore')) return <GitignoreIcon className="h-4 w-4" />;
    if (fileName.includes('.gitkeep')) return <FileIcon className="h-4 w-4" />;
    return <TxtIcon className="h-4 w-4" />;
};

const buildFileTree = (files: GeneratedFiles) => {
    const tree: any = {};
    Object.keys(files).forEach(path => {
        if (files[path] === undefined) return; 
        const parts = path.split('/');
        let currentLevel = tree;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                currentLevel[part] = { _path: path };
            } else {
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }
        });
    });
    return tree;
};

const FileTree: React.FC<{
    tree: any;
    selectedFile: string;
    onFileSelect: (file: string) => void;
    level?: number;
}> = ({ tree, selectedFile, onFileSelect, level = 0 }) => {
    return (
        <ul className="space-y-1">
            {Object.keys(tree).sort((a,b) => {
                const aIsFolder = !tree[a]._path;
                const bIsFolder = !tree[b]._path;
                if (aIsFolder && !bIsFolder) return -1;
                if (!aIsFolder && bIsFolder) return 1;
                return a.localeCompare(b);
            }).map(key => {
                const node = tree[key];
                const isFolder = !node._path;

                if (isFolder) {
                    return (
                        <li key={key}>
                            <div className="flex items-center gap-2 text-geode-light" style={{ paddingLeft: `${level * 1}rem` }}>
                                <FolderIcon className="h-5 w-5 text-geode-blue" />
                                <span className="text-sm font-semibold">{key}</span>
                            </div>
                            <div className="mt-1">
                                <FileTree tree={node} selectedFile={selectedFile} onFileSelect={onFileSelect} level={level + 1} />
                            </div>
                        </li>
                    );
                } else {
                    const path = node._path as string;
                    return (
                        <li key={path}>
                            <button
                                onClick={() => onFileSelect(path)}
                                className={`w-full flex items-center gap-2 px-2 py-1 text-left rounded-md transition-colors ${
                                    selectedFile === path ? 'bg-geode-surface text-geode-teal' : 'text-geode-light hover:bg-geode-surface/50'
                                }`}
                                style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
                            >
                                {getIcon(path)}
                                <span className="text-sm">{key}</span>
                            </button>
                        </li>
                    );
                }
            })}
        </ul>
    );
};


const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onFileSelect }) => {

    if (!files) {
        return (
            <div className="bg-geode-crust p-4 h-full">
                <p className="text-geode-overlay text-sm text-center mt-4">Fill out the form to generate files.</p>
            </div>
        );
    }
    
    const fileTree = buildFileTree(files);

    return (
        <div className="bg-geode-crust h-full flex flex-col">
            <div className="flex-1 p-3 overflow-y-auto">
                <h3 className="text-xs font-bold uppercase text-geode-overlay mb-3 px-2">Project Files</h3>
                <FileTree tree={fileTree} selectedFile={selectedFile} onFileSelect={onFileSelect} />
            </div>
        </div>
    );
};

export default FileExplorer;