import React from 'react';
import { GeodeIcon } from './IconComponents';

interface StartupAnimationProps {
    onAnimationEnd: () => void;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onAnimationEnd }) => {
    return (
        <div
            className="fixed inset-0 bg-geode-crust z-50 flex items-center justify-center animate-splash-screen-fade-out"
            onAnimationEnd={onAnimationEnd}
            aria-hidden="true"
        >
            <div className="text-center animate-splash-logo-fade-in">
                <GeodeIcon className="h-24 w-24 text-geode-teal mx-auto mb-4" />
                <h1 className="text-5xl font-extrabold text-geode-light">
                    Geode Mod Creator
                </h1>
            </div>
        </div>
    );
};

export default StartupAnimation;
