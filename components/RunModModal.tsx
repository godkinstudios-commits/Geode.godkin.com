import React, { useState, useEffect } from 'react';
import { TerminalIcon } from './IconComponents';

interface HowToRunModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-geode-crust p-3 rounded-md text-geode-teal font-mono text-sm overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const HowToRunModal: React.FC<HowToRunModalProps> = ({ isOpen, onClose }) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        // Reset animation state if the modal is closed externally
        if (!isOpen) {
            setIsAnimatingOut(false);
        }
    }, [isOpen]);
    
    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(onClose, 200); // Must match animation duration
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 bg-geode-crust bg-opacity-75 flex items-center justify-center z-50 p-4 ${isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`bg-geode-mantle rounded-lg shadow-xl border border-geode-surface w-full max-w-2xl transform transition-all ${isAnimatingOut ? 'animate-modal-out' : 'animate-modal-in'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-geode-surface">
                    <h2 className="text-xl font-bold text-geode-light flex items-center gap-3">
                        <TerminalIcon className="h-6 w-6 text-geode-green" />
                        How to Run Your Mod
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="text-geode-overlay hover:text-geode-light text-2xl"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6 space-y-4 text-geode-light max-h-[80vh] overflow-y-auto">
                    <p>
                        This web tool generates the source code for your mod. To run it in Geometry Dash, you need to compile it on your computer using the Geode tools.
                    </p>
                    
                    <div>
                        <h3 className="font-semibold text-geode-blue mb-2 text-lg">Prerequisites</h3>
                        <p className="text-sm text-geode-overlay">
                            Make sure you have the <a href="https://geode-sdk.org/install/" target="_blank" rel="noopener noreferrer" className="text-geode-teal underline">Geode SDK and CLI</a> installed on your system.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-geode-blue mb-2 text-lg">Step 1: Download and Unzip</h3>
                        <p className="text-sm text-geode-overlay mb-2">
                            Click the "Generate & Download Source" button. The downloaded file is a <code className="bg-geode-crust p-1 rounded-sm text-xs">.zip</code> archive containing all your project source files. Unzip it to a new folder on your computer.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-geode-blue mb-2 text-lg">Step 2: Open a Terminal</h3>
                        <p className="text-sm text-geode-overlay mb-2">
                            Open your system's terminal (like Command Prompt, PowerShell, or Terminal) and navigate into the folder where you unzipped your mod.
                        </p>
                        <CodeBlock>cd path/to/your/mod</CodeBlock>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-geode-blue mb-2 text-lg">Step 3: Build the Mod</h3>
                        <p className="text-sm text-geode-overlay mb-2">
                            Run the following command to compile your mod. This will create the actual installable mod file.
                        </p>
                        <CodeBlock>geode build</CodeBlock>
                    </div>

                    <div>
                        <h3 className="font-semibold text-geode-blue mb-2 text-lg">Step 4: Run the Mod</h3>
                        <p className="text-sm text-geode-overlay mb-2">
                            Finally, run this command to launch Geometry Dash with your new mod installed and loaded.
                        </p>
                        <CodeBlock>geode run</CodeBlock>
                    </div>

                </div>
                 <div className="p-4 bg-geode-crust border-t border-geode-surface text-right">
                    <button
                        onClick={handleClose}
                        className="bg-geode-blue text-geode-crust font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowToRunModal;