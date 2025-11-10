import React, { useState, useEffect, useRef } from 'react';
import type { ModData } from '../types';
import { PlayIcon, CogIcon, TerminalIcon, SkullIcon, CharacterIcon, ExpandIcon, ShrinkIcon } from './IconComponents';

interface LivePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    modData: ModData;
    onShowHowTo: () => void;
}

const GDButton: React.FC<{ icon: React.ReactNode, text?: string }> = ({ icon, text }) => (
    <button className="bg-gradient-to-b from-green-400 to-green-600 w-20 h-20 rounded-xl shadow-lg border-2 border-black/20 flex flex-col items-center justify-center text-white transform hover:scale-105 transition-transform">
        {icon}
        {text && <span className="text-xs font-bold uppercase mt-1">{text}</span>}
    </button>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-14 h-7 bg-red-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
    </label>
);

const LivePreviewModal: React.FC<LivePreviewModalProps> = ({ isOpen, onClose, modData, onShowHowTo }) => {
    const simulationContainerRef = useRef<HTMLElement>(null);
    const [isSettingEnabled, setIsSettingEnabled] = useState(true);
    const [showDeathNotification, setShowDeathNotification] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        // Reset state when modal is opened or template changes
        setIsSettingEnabled(true);
        setShowDeathNotification(false);
        if (!isOpen) {
            setIsAnimatingOut(false);
        }
    }, [isOpen, modData.cppTemplate]);

    const handleSimulateDeath = () => {
        setShowDeathNotification(true);
        setTimeout(() => {
            setShowDeathNotification(false);
        }, 3000); // Must match animation duration
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(onClose, 200); // Must match animation duration
    };

    if (!isOpen) {
        return null;
    }
    
    const handleFullscreen = () => {
        if (!simulationContainerRef.current) return;

        if (!document.fullscreenElement) {
            simulationContainerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const modName = modData.name || "My Awesome Mod";

    const renderSimulation = () => {
        const baseMenu = (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <h1 className="text-5xl font-bold text-white uppercase" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                    Geometry Dash
                </h1>
                <div className="absolute bottom-20 flex gap-4">
                    <GDButton icon={<PlayIcon className="h-10 w-10" />} />
                    <GDButton icon={<CharacterIcon className="h-10 w-10" />} />
                    <GDButton icon={<CogIcon className="h-10 w-10" />} />
                </div>
            </div>
        );

        switch (modData.cppTemplate) {
            case 'menulayer':
                return (
                    <div className="relative w-full h-full">
                        {baseMenu}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 text-center text-white text-xl font-bold" style={{ textShadow: '2px 2px 4px #000' }}>
                            <p>Hello from {modName}!</p>
                        </div>
                    </div>
                );
            
            case 'playlayer':
                return (
                     <div className="relative w-full h-full bg-blue-900 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gray-700"></div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <h2 className="text-white text-lg font-bold mb-4">In-Game Simulation</h2>
                             <button onClick={handleSimulateDeath} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                                Simulate Death
                            </button>
                        </div>
                         {showDeathNotification && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white p-3 rounded-lg flex items-center gap-3 animate-notification-slide">
                                <SkullIcon className="h-6 w-6 text-red-500" />
                                <span className="font-bold">You died!</span>
                            </div>
                        )}
                    </div>
                );

            case 'settings':
                 return (
                    <div className="relative w-full h-full">
                        {baseMenu}
                        {isSettingEnabled && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 text-center text-white text-xl font-bold" style={{ textShadow: '2px 2px 4px #000' }}>
                                <p>Hello from My Mod!</p>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/50 p-4 rounded-lg text-white space-y-2">
                             <p className="font-bold text-sm">Mod Settings</p>
                            <div className="flex items-center gap-3">
                                <label className="text-xs">Show Hello Text</label>
                                <ToggleSwitch checked={isSettingEnabled} onChange={() => setIsSettingEnabled(!isSettingEnabled)} />
                            </div>
                        </div>
                    </div>
                );

            default:
                return <p className="text-white">No preview available for this template.</p>;
        }
    };
    
    return (
        <div 
            className={`fixed inset-0 bg-geode-crust bg-opacity-75 flex items-center justify-center z-50 p-4 ${isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`bg-geode-mantle rounded-lg shadow-xl border border-geode-surface w-full max-w-3xl aspect-[16/9] transform transition-all flex flex-col overflow-hidden ${isAnimatingOut ? 'animate-modal-out' : 'animate-modal-in'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-3 border-b border-geode-surface bg-geode-crust/80 backdrop-blur-sm z-10">
                    <h2 className="text-lg font-bold text-geode-light flex items-center gap-3">
                        <PlayIcon className="h-5 w-5 text-geode-green" />
                        Live Mod Preview
                    </h2>
                    <div className="flex items-center gap-4">
                         <button
                            onClick={handleFullscreen}
                            className="text-geode-overlay hover:text-geode-light"
                            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                        >
                            {isFullscreen ? (
                                <ShrinkIcon className="h-5 w-5" />
                            ) : (
                                <ExpandIcon className="h-5 w-5" />
                            )}
                        </button>
                        <button 
                            onClick={handleClose} 
                            className="text-geode-overlay hover:text-geode-light text-2xl"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                </header>
                <main 
                    ref={simulationContainerRef}
                    className="flex-1 relative bg-gradient-to-b from-blue-400 to-blue-600"
                >
                    {renderSimulation()}
                </main>
                <footer className="p-3 bg-geode-crust/80 backdrop-blur-sm border-t border-geode-surface flex justify-between items-center z-10">
                    <button onClick={onShowHowTo} className="flex items-center gap-2 text-xs text-geode-overlay hover:text-geode-light transition-colors">
                        <TerminalIcon className="h-4 w-4" />
                        How do I run this for real?
                    </button>
                    <button
                        onClick={handleClose}
                        className="bg-geode-blue text-geode-crust font-bold py-1.5 px-4 rounded-md hover:bg-opacity-90 text-sm"
                    >
                        Close Preview
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default LivePreviewModal;