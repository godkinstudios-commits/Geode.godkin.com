import React, { useState, useEffect } from 'react';
import type { ModData, ModSetting, ModSettingType } from '../types';
import { DownloadIcon, LoadingIcon, InfoIcon, SparklesIcon, ImageIcon, UploadIcon, TrashIcon, CogIcon } from './IconComponents';

interface ModFormProps {
    modData: ModData;
    onFormChange: (modData: ModData) => void;
    onDownload: () => void;
    isDownloading: boolean;
    // AI props
    aiEnabled: boolean;
    modIdea: string;
    onModIdeaChange: (value: string) => void;
    onGenerateNameAndId: () => void;
    isGeneratingName: boolean;
    onGenerateDescription: () => void;
    isGeneratingDesc: boolean;
    onSuggestTags: () => void;
    isGeneratingTags: boolean;
    onGenerateLogo: () => void;
    isGeneratingLogo: boolean;
    onGenerateSettings: () => void;
    isGeneratingSettings: boolean;
    aiError: string;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs bg-geode-crust border border-geode-surface text-center text-sm text-geode-light rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {text}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; id: string; value: string; placeholder: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string; required?: boolean; children?: React.ReactNode }> = ({ label, id, value, placeholder, onChange, hint, required, children }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label htmlFor={id} className="block text-sm font-medium text-geode-blue">
                {label} {required && <span className="text-geode-red">*</span>}
            </label>
            {children}
        </div>
        <input
            type="text"
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-2 text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
        />
        {hint && <p className="mt-1 text-xs text-geode-overlay">{hint}</p>}
    </div>
);

const SelectField: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; hint?: string; }> = ({ label, id, value, onChange, children, hint }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-geode-blue mb-1">
            {label}
        </label>
        <select
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-2 text-geode-light focus:outline-none focus:ring-2 focus:ring-geode-teal"
        >
            {children}
        </select>
        {hint && <p className="mt-1 text-xs text-geode-overlay">{hint}</p>}
    </div>
);


const CheckboxField: React.FC<{ label: string; id: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string; tooltip?: string; }> = ({ label, id, checked, onChange, hint, tooltip }) => (
    <div className="flex items-center gap-3">
        <input
            type="checkbox"
            id={id}
            name={id}
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 rounded border-geode-surface bg-geode-crust text-geode-teal focus:ring-geode-teal"
        />
        <div className="flex items-center gap-1.5">
            <label htmlFor={id} className="font-medium text-geode-light text-sm">{label}</label>
            {tooltip && (
                <Tooltip text={tooltip}>
                    <InfoIcon className="h-4 w-4 text-geode-overlay" />
                </Tooltip>
            )}
        </div>
    </div>
);


const ModForm: React.FC<ModFormProps> = ({ modData, onFormChange, onDownload, isDownloading, aiEnabled, modIdea, onModIdeaChange, onGenerateNameAndId, isGeneratingName, onGenerateDescription, isGeneratingDesc, onSuggestTags, isGeneratingTags, onGenerateLogo, isGeneratingLogo, onGenerateSettings, isGeneratingSettings, aiError }) => {
    const [idError, setIdError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        if (name in modData.platforms) {
            onFormChange({
                ...modData,
                platforms: {
                    ...modData.platforms,
                    [name]: newValue,
                }
            });
        } else {
            onFormChange({
                ...modData,
                [name]: newValue
            });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/png") {
            const reader = new FileReader();
            reader.onloadend = () => {
                onFormChange({ ...modData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Please upload a PNG file.");
        }
    };
    
    // --- Settings Handlers ---

    const addSetting = () => {
        const newSetting: ModSetting = {
            id: `setting-${Date.now()}`,
            key: `new-setting-${modData.settings.length}`,
            name: 'New Setting',
            description: 'A description for the new setting.',
            type: 'bool',
            default: false,
        };
        onFormChange({ ...modData, settings: [...modData.settings, newSetting] });
    };

    const removeSetting = (id: string) => {
        onFormChange({ ...modData, settings: modData.settings.filter(s => s.id !== id) });
    };

    const handleSettingChange = (id: string, field: keyof ModSetting, value: any) => {
        const newSettings = modData.settings.map(s => {
            if (s.id === id) {
                const updatedSetting = { ...s, [field]: value };
                // When type changes, reset default value
                if (field === 'type') {
                    switch (value as ModSettingType) {
                        case 'bool': updatedSetting.default = false; break;
                        case 'int': updatedSetting.default = 0; break;
                        case 'float': updatedSetting.default = 0.0; break;
                        case 'string': updatedSetting.default = ''; break;
                    }
                }
                return updatedSetting;
            }
            return s;
        });
        onFormChange({ ...modData, settings: newSettings });
    };

    const renderDefaultValueInput = (setting: ModSetting) => {
        switch (setting.type) {
            case 'bool':
                return (
                    <input
                        type="checkbox"
                        checked={!!setting.default}
                        onChange={(e) => handleSettingChange(setting.id, 'default', e.target.checked)}
                        className="h-5 w-5 rounded border-geode-surface bg-geode-crust text-geode-teal focus:ring-geode-teal"
                    />
                );
            case 'int':
            case 'float':
                return (
                    <input
                        type="number"
                        value={setting.default as number}
                        step={setting.type === 'float' ? '0.1' : '1'}
                        onChange={(e) => handleSettingChange(setting.id, 'default', e.target.value)}
                        className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-sm text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
                    />
                );
            case 'string':
                return (
                    <input
                        type="text"
                        value={setting.default as string}
                        onChange={(e) => handleSettingChange(setting.id, 'default', e.target.value)}
                        className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-sm text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
                    />
                );
            default:
                return null;
        }
    };


    useEffect(() => {
        const regex = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
        if (modData.id && !regex.test(modData.id)) {
            setIdError('Mod ID must be in reverse domain format, e.g., com.yourname.modname');
        } else {
            setIdError('');
        }
    }, [modData.id]);
    
    const isFormValid = modData.id && modData.name && modData.developer && !idError;
    const isAnyAiRunning = isGeneratingName || isGeneratingDesc || isGeneratingTags || isGeneratingLogo || isGeneratingSettings;

    const AITooltip = !aiEnabled ? "To use AI features, please set the API_KEY environment variable." : undefined;

    return (
        <div className="bg-geode-mantle p-6 rounded-lg shadow-lg border border-geode-surface">
            <h2 className="text-2xl font-bold mb-6 text-geode-teal">Mod Details</h2>
            <form className="space-y-4">
                
                <fieldset className="space-y-4 border-b border-geode-surface pb-6">
                    <legend className="text-lg font-semibold text-geode-light mb-2 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-geode-teal" />
                        AI Assistant
                    </legend>
                    <InputField label="Describe Your Mod Idea" id="modIdea" value={modIdea} onChange={(e) => onModIdeaChange(e.target.value)} placeholder="e.g., a mod that adds a rainbow trail to the player" hint="Let AI generate a name and ID for you."/>
                    <button type="button" onClick={onGenerateNameAndId} disabled={!aiEnabled || !modIdea || isAnyAiRunning} className="w-full flex items-center justify-center gap-2 bg-geode-blue text-geode-crust font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed">
                        {isGeneratingName ? <LoadingIcon className="animate-spin h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                        {isGeneratingName ? 'Generating...' : 'Suggest Name & ID'}
                    </button>
                    {!aiEnabled && <p className="text-xs text-geode-overlay text-center">AI features disabled. API key not configured.</p>}

                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2">Core Info</legend>
                    <InputField label="Mod ID" id="id" value={modData.id} onChange={handleChange} placeholder="com.yourname.modname" hint="A unique identifier. Lowercase, numbers, hyphens, and periods only." required />
                    {idError && <p className="text-sm text-geode-red -mt-2">{idError}</p>}
                    <InputField label="Mod Name" id="name" value={modData.name} onChange={handleChange} placeholder="My Awesome Mod" required />
                    <InputField label="Developer" id="developer" value={modData.developer} onChange={handleChange} placeholder="Your Name" required />
                    <InputField label="Version" id="version" value={modData.version} onChange={handleChange} placeholder="v1.0.0" hint="Follows Semantic Versioning (SemVer)." required />
                    <SelectField label="Geode Version" id="geodeVersion" value={modData.geodeVersion} onChange={handleChange} hint="Select the Geode SDK version your mod targets.">
                        <option value="2.0.0-beta.26">v2.0.0-beta.26 (Latest)</option>
                        <option value="2.0.0-beta.25">v2.0.0-beta.25</option>
                        <option value="2.0.0-beta.24">v2.0.0-beta.24</option>
                        <option value="2.0.0-beta.23">v2.0.0-beta.23</option>
                        <option value="2.0.0-beta.22">v2.0.0-beta.22</option>
                    </SelectField>
                    <div>
                         <div className="flex justify-between items-center mb-1">
                            <label htmlFor="description" className="block text-sm font-medium text-geode-blue">Description</label>
                            <Tooltip text={AITooltip ?? "Generate with AI"}>
                                <button type="button" onClick={onGenerateDescription} disabled={!aiEnabled || !modData.name || isAnyAiRunning} className="text-xs flex items-center gap-1 text-geode-blue hover:text-geode-teal disabled:text-geode-overlay disabled:cursor-not-allowed">
                                    {isGeneratingDesc ? <LoadingIcon className="animate-spin h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                    Generate
                                </button>
                            </Tooltip>
                        </div>
                        <textarea id="description" name="description" rows={3} value={modData.description} onChange={handleChange} placeholder="A brief summary of what your mod does." className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-2 text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"></textarea>
                    </div>
                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2">Mod Logo</legend>
                    <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-geode-crust rounded-md flex items-center justify-center border-2 border-dashed border-geode-surface">
                            {modData.logo ? (
                                <img src={modData.logo} alt="Mod logo preview" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <ImageIcon className="h-10 w-10 text-geode-overlay" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                             <input type="file" id="logo-upload" accept="image/png" onChange={handleLogoUpload} className="hidden" />
                            <label htmlFor="logo-upload" className="w-full cursor-pointer flex items-center justify-center gap-2 bg-geode-surface text-geode-light font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all">
                                <UploadIcon className="h-5 w-5" />
                                Upload logo.png
                            </label>

                            <button type="button" onClick={onGenerateLogo} disabled={!aiEnabled || !modData.name || isAnyAiRunning} className="w-full flex items-center justify-center gap-2 bg-geode-blue text-geode-crust font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed">
                                {isGeneratingLogo ? <LoadingIcon className="animate-spin h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                                {isGeneratingLogo ? 'Generating...' : 'Generate with AI'}
                            </button>
                             {modData.logo && (
                                <button type="button" onClick={() => onFormChange({...modData, logo: undefined})} className="text-xs text-geode-red hover:underline">Remove Logo</button>
                            )}
                        </div>
                    </div>
                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2">Platform & Targeting</legend>
                    <div>
                        <label className="block text-sm font-medium text-geode-blue mb-2">Supported Platforms</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <CheckboxField label="Windows" id="win" checked={modData.platforms.win} onChange={handleChange} />
                            <CheckboxField label="macOS" id="mac" checked={modData.platforms.mac} onChange={handleChange} />
                            <CheckboxField label="Android" id="android" checked={modData.platforms.android} onChange={handleChange} />
                            <CheckboxField label="iOS" id="ios" checked={modData.platforms.ios} onChange={handleChange} />
                        </div>
                    </div>
                     <SelectField label="Geometry Dash Version" id="gdVersion" value={modData.gdVersion} onChange={handleChange} hint="Select the game version your mod is for. Use '*' for all versions.">
                        <option value="*">Any Version (*)</option>
                        <option value="2.2.143">2.2.143 (Latest)</option>
                        <option value="2.206">2.206</option>
                        <option value="2.2.0">2.2.0</option>
                        <option value="2.11">2.11</option>
                        <option value="2.1.0">2.1.0</option>
                    </SelectField>
                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2">Features & Templates</legend>
                    <div>
                        <label htmlFor="cppTemplate" className="block text-sm font-medium text-geode-blue mb-1">C++ Template</label>
                        <select id="cppTemplate" name="cppTemplate" value={modData.cppTemplate} onChange={handleChange} className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-2 text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal">
                            <option value="menulayer">"Hello World" on MenuLayer</option>
                            <option value="playlayer">Hook Player Death in PlayLayer</option>
                            <option value="settings">Functional Settings Page</option>
                        </select>
                        <p className="mt-1 text-xs text-geode-teal">
                            Note: The 'Settings' template will automatically generate C++ code for the custom settings you define below.
                        </p>
                    </div>
                    <InputField label="Dependencies" id="dependencies" value={modData.dependencies} onChange={handleChange} placeholder="geode.node-ids@^1.2.0, other.mod-id" hint="Comma-separated. Use `mod-id@version` to specify a version (defaults to `*`)." />
                    <InputField label="GitHub Repository" id="repository" value={modData.repository} onChange={handleChange} placeholder="https://github.com/yourname/modname" hint="Optional URL for your mod's source code." />
                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2 flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <CogIcon className="h-5 w-5" />
                            Custom Settings
                        </div>
                        <Tooltip text={AITooltip ?? "Generate settings with AI based on your mod description."}>
                            <button
                                type="button"
                                onClick={onGenerateSettings}
                                disabled={!aiEnabled || !modData.name || !modData.description || isAnyAiRunning}
                                className="text-xs flex items-center gap-1 text-geode-blue hover:text-geode-teal disabled:text-geode-overlay disabled:cursor-not-allowed"
                            >
                                {isGeneratingSettings ? <LoadingIcon className="animate-spin h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                {isGeneratingSettings ? 'Generating...' : 'Generate with AI'}
                            </button>
                        </Tooltip>
                    </legend>
                    <div className="space-y-4">
                        {modData.settings.length > 0 ? modData.settings.map((setting, index) => (
                            <div key={setting.id} className="bg-geode-crust/50 p-4 rounded-md border border-geode-surface space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold text-geode-light">{`Setting #${index + 1}`}</p>
                                    <button type="button" onClick={() => removeSetting(setting.id)} className="text-geode-red hover:text-opacity-80 p-1 rounded-full">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <input
                                        type="text"
                                        value={setting.key}
                                        onChange={(e) => handleSettingChange(setting.id, 'key', e.target.value)}
                                        placeholder="setting-key"
                                        className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
                                    />
                                    <select
                                        value={setting.type}
                                        onChange={(e) => handleSettingChange(setting.id, 'type', e.target.value)}
                                        className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-geode-light focus:outline-none focus:ring-2 focus:ring-geode-teal"
                                    >
                                        <option value="bool">Boolean (Checkbox)</option>
                                        <option value="int">Integer</option>
                                        <option value="float">Float</option>
                                        <option value="string">String</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    value={setting.name}
                                    onChange={(e) => handleSettingChange(setting.id, 'name', e.target.value)}
                                    placeholder="Setting Name (in-game)"
                                    className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-sm text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
                                />
                                <textarea
                                    value={setting.description}
                                    onChange={(e) => handleSettingChange(setting.id, 'description', e.target.value)}
                                    placeholder="Setting Description"
                                    rows={2}
                                    className="w-full bg-geode-mantle border border-geode-surface rounded-md px-3 py-1.5 text-sm text-geode-light placeholder-geode-overlay focus:outline-none focus:ring-2 focus:ring-geode-teal"
                                />
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-geode-blue">Default Value:</label>
                                    {renderDefaultValueInput(setting)}
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-geode-overlay text-center py-4">No custom settings defined. Click "Add Setting" or "Generate with AI" to add some!</p>
                        )}
                         <button type="button" onClick={addSetting} className="w-full text-sm flex items-center justify-center gap-2 bg-geode-surface text-geode-light font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all">
                            + Add Setting
                        </button>
                    </div>
                </fieldset>

                <fieldset className="space-y-4 border-b border-geode-surface pb-6 pt-4">
                    <legend className="text-lg font-semibold text-geode-light mb-2">Advanced Options</legend>
                    <div className="space-y-3">
                         <CheckboxField 
                            label="Provides an API" 
                            id="providesApi" 
                            checked={modData.providesApi} 
                            onChange={handleChange} 
                            tooltip="Check this if your mod adds new functions or classes that other mods can use. This will add 'api: true' to your mod.json."
                        />
                         <CheckboxField 
                            label="Early Load" 
                            id="earlyLoad" 
                            checked={modData.earlyLoad} 
                            onChange={handleChange} 
                            tooltip="For advanced users. Check this if your mod needs to load before most other mods. This can be useful for core libraries or patches."
                        />
                         <CheckboxField 
                            label="Include CI Workflow" 
                            id="includeCi" 
                            checked={modData.includeCi} 
                            onChange={handleChange} 
                            tooltip="Include a GitHub Actions workflow file for automatically building your mod on push/pull request."
                        />
                    </div>
                </fieldset>

                <fieldset className="space-y-4 pt-4">
                     <div className="flex justify-between items-center mb-1">
                        <label htmlFor="tags" className="block text-sm font-medium text-geode-blue">Tags</label>
                        <Tooltip text={AITooltip ?? "Suggest with AI"}>
                            <button type="button" onClick={onSuggestTags} disabled={!aiEnabled || !modData.name || isAnyAiRunning} className="text-xs flex items-center gap-1 text-geode-blue hover:text-geode-teal disabled:text-geode-overlay disabled:cursor-not-allowed">
                                {isGeneratingTags ? <LoadingIcon className="animate-spin h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                Suggest
                            </button>
                        </Tooltip>
                    </div>
                    <InputField label="" id="tags" value={modData.tags} onChange={handleChange} placeholder="gameplay, utility, cosmetic" hint="Comma-separated list of tags for the mod index." />
                </fieldset>

                {aiError && <p className="text-sm text-center text-geode-red">{aiError}</p>}
                
                <button type="button" onClick={onDownload} disabled={!isFormValid || isDownloading} className="w-full mt-4 flex items-center justify-center gap-2 bg-geode-green text-geode-crust font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-all disabled:bg-geode-surface disabled:text-geode-overlay disabled:cursor-not-allowed">
                    {isDownloading ? <LoadingIcon className="animate-spin h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                    {isDownloading ? 'Zipping...' : 'Generate & Download Source'}
                </button>
            </form>
        </div>
    );
};

export default ModForm;
