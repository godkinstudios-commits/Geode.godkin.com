import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type, Chat, FunctionDeclaration } from "@google/genai";
import type { ModData, GeneratedFiles, ChatMessage, ModSetting } from './types';
import { generateModJson, generateCMakeLists, generateMainCpp, generateCIWorkflow, generateReadme, generateGitIgnore, generateLicense, generateContributingMd } from './services/modGenerator';
import ModForm from './components/ModForm';
import CodeWorkspace from './components/CodeWorkspace';
import ChatHistory from './components/ChatHistory';
import HowToRunModal from './components/RunModModal';
import LivePreviewModal from './components/LivePreviewModal';
import { GeodeIcon } from './components/IconComponents';
import StartupAnimation from './components/StartupAnimation';

// Make JSZip available from the global scope (loaded via CDN)
declare const JSZip: any;

/**
 * Parses a caught error from an AI API call and returns a user-friendly string.
 * @param error The error object caught.
 * @returns A string explaining the error in a user-friendly way.
 */
const parseAiError = (error: any): string => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Full AI Error:", error); // Log the full error for debugging

    const lowerErrorMessage = errorMessage.toLowerCase();

    if (lowerErrorMessage.includes('api key not valid') || lowerErrorMessage.includes('api_key_invalid')) {
        return "Your API key is invalid or missing. Please ensure it's configured correctly.";
    }
    if (lowerErrorMessage.includes('429') || lowerErrorMessage.includes('rate limit')) {
        return "You've made too many requests in a short period. Please wait a moment and try again.";
    }
    if (lowerErrorMessage.includes('500') || lowerErrorMessage.includes('internal error') || lowerErrorMessage.includes('rpc failed')) {
        return "An internal error occurred with the AI service. This might be a temporary issue, please try again later.";
    }
    if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('xhr error')) {
        return "A network error occurred. Please check your internet connection and try again.";
    }
    if (lowerErrorMessage.includes('invalid json response')) {
        return "The AI returned an invalid response format. This might be a temporary issue. Trying again may help.";
    }
    if (lowerErrorMessage.includes('deadline_exceeded')) {
        return "The request to the AI service timed out. Please check your network and try again."
    }

    return "An unexpected AI error occurred. Please check the browser console for more details.";
};

const GIGI_SYSTEM_INSTRUCTION = `You are Gigi, an expert Geode modding assistant inside a mod creation tool.
Your primary goal is to help users by writing C++ code, creating assets, and answering questions about modding Geometry Dash with Geode.
You are an expert on the Geode SDK and follow its best practices.

**Core Geode Modding Concepts (Your Knowledge Base):**

*   **Project Structure:** A mod has a \`mod.json\` for metadata, a \`CMakeLists.txt\` for building, a \`src\` folder for C++ code, and an \`assets\` folder for resources.
*   **\`mod.json\`:** This is the manifest. It defines the mod's ID, name, developer, version, dependencies, and settings. Settings are defined as a JSON object with keys for each setting's ID.
*   **Hooking with \`$modify\`:** This is the primary way to change game behavior.
    *   Syntax: \`class $modify(MyHookName, TargetLayer) { ... };\`
    *   You can hook member functions (e.g., \`bool init()\`) to add new behavior.
    *   **Crucially, always call the original function** (e.g., \`if (!TargetLayer::init()) return false;\`) to avoid breaking the game.
    *   Use \`m_fields\` to add new member variables to a hooked class.
*   **Adding UI Elements:**
    *   Most UI is added to layers like \`MenuLayer\`, \`PlayLayer\`, etc.
    *   Get screen size with \`CCDirector::sharedDirector()->getWinSize()\`.
    *   Common Cocos2d-x nodes: \`CCLabelBMFont\`, \`CCSprite\`, \`CCMenu\`, \`ButtonSprite\`.
    *   Add nodes to the current layer using \`this->addChild(...)\`.
*   **Settings:**
    *   Settings are defined in \`mod.json\`.
    *   The UI for settings is created in C++ inside a \`$execute\` block that calls \`geode::ui::createSettingsPopup\`.
    *   Use UI components like \`geode::Checkbox\` and \`geode::InputNode\` to build the settings menu.
    *   Retrieve setting values in your code with \`Mod::get()->getSettingValue<type>("setting-key")\`.
*   **Saving Data:**
    *   Use \`Mod::get()->setSavedValue<type>("save-key", value)\` to save persistent data.
    *   Use \`Mod::get()->getSavedValue<type>("save-key", defaultValue)\` to load it.
*   **Logging:** Use \`log::info("My message")\` or \`log::debug("My message: {} and {}", var1, var2)\` for debugging. This is better than \`std::cout\`.
*   **Best Practices:** Always wrap your hook logic in \`try-catch\` blocks to prevent crashes if something goes wrong.

**Your Response Modes:**

1.  **Code & Text File Generation:**
    When the user asks you to write, create, add, or modify one or more code or text files (like .cpp, .md, .json), you MUST respond ONLY with a single, raw JSON object. Do not include markdown fences (\`\`\`json) or explanations.
    The JSON object must have a single key "files", which is an array of file objects. Each file object must have:
    - "filePath": A string representing the full, relative path (e.g., "src/MyAwesomeHook.cpp").
    - "fileContent": A string containing the complete, valid content for that file.

    **Example Multi-File Code Generation Response:**
    {"files": [{"filePath": "src/utils/PlayerUtils.hpp", "fileContent": "#pragma once\\n\\nvoid myHelperFunction();"}, {"filePath": "src/utils/PlayerUtils.cpp", "fileContent": "#include \\"PlayerUtils.hpp\\"\\n#include <Geode/Geode.hpp>\\n\\nvoid myHelperFunction() {\\n    log::info(\\"Helper function called!\\");\\n}"}]}

2.  **Image Asset Generation:**
    When the user asks you to create a visual asset (like an icon, button, spritesheet, or texture), you MUST use the \`generateImageAndPlist\` tool.
    - Provide a detailed, descriptive \`prompt\` for the AI image model. Describe the style (e.g., "geometric, neon, fitting Geometry Dash's art style"), the content, and request a transparent background.
    - Provide a \`fileName\` ending in \`.png\`.
    - Provide an array of \`spriteNames\` that correspond to the different parts of the image you are requesting, which will be used to create a matching \`.plist\` file. For a single icon, you can just provide one name.

3.  **General Conversation:**
    If the user asks a question, wants an explanation, or has a conversation that does not involve creating a file, respond with a helpful, conversational text message based on your Geode knowledge. DO NOT use the JSON format for these responses. Explain concepts clearly and provide code snippets where helpful.
`;

const generateImageAndPlistTool: FunctionDeclaration = {
    name: 'generateImageAndPlist',
    description: 'Generates a PNG image asset and a corresponding Cocos2d .plist file for a Geometry Dash mod. Use this for icons, buttons, spritesheets, etc.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: 'A detailed, descriptive prompt for the image generation model. Should describe style, content, and background.',
            },
            fileName: {
                type: Type.STRING,
                description: 'The base filename for the asset, ending in .png. For example, "my-spritesheet.png".',
            },
            spriteNames: {
                type: Type.ARRAY,
                description: 'An array of strings, where each string is the name of a sprite within the generated image. This will be used to create the .plist file.',
                items: {
                    type: Type.STRING
                }
            }
        },
        required: ['prompt', 'fileName', 'spriteNames'],
    }
};

const App: React.FC = () => {
    const [modData, setModData] = useState<ModData>({
        id: '',
        name: '',
        version: 'v1.0.0',
        developer: '',
        description: '',
        logo: undefined,
        dependencies: '',
        repository: '',
        cppTemplate: 'menulayer',
        includeCi: false,
        platforms: {
            win: true,
            mac: true,
            android: true,
            ios: false,
        },
        gdVersion: '*',
        geodeVersion: '2.0.0-beta.26',
        tags: '',
        providesApi: false,
        earlyLoad: false,
        settings: [{
            id: 'setting-initial-1',
            key: 'welcome_message',
            name: 'Welcome Message',
            description: 'The message to display on startup',
            type: 'string',
            default: 'Hello, Geode!',
        }],
    });
    
    const [modIdea, setModIdea] = useState('');
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isHowToRunModalOpen, setIsHowToRunModalOpen] = useState<boolean>(false);
    const [isLivePreviewModalOpen, setIsLivePreviewModalOpen] = useState<boolean>(false);
    const [showSplash, setShowSplash] = useState(true);


    // AI States
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [aiEnabled, setAiEnabled] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string>('');
    const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState<boolean>(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState<boolean>(false);
    const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);
    const [isGeneratingSettings, setIsGeneratingSettings] = useState<boolean>(false);
    const [isChatting, setIsChatting] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isDeepThinkEnabled, setIsDeepThinkEnabled] = useState<boolean>(false);

    const handleToggleDeepThink = () => setIsDeepThinkEnabled(prev => !prev);


    useEffect(() => {
        if (process.env.API_KEY) {
            try {
                const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
                setAi(genAI);
                setAiEnabled(true);
                const newChat = genAI.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: GIGI_SYSTEM_INSTRUCTION,
                        tools: [{ functionDeclarations: [generateImageAndPlistTool] }]
                    }
                });
                setChat(newChat);
            } catch (error) {
                console.error("Failed to initialize GoogleGenAI:", error);
                setAiError("Failed to initialize AI. Check API key.");
                setAiEnabled(false);
            }
        }
    }, []);

    const generateFiles = useCallback(() => {
        const files: GeneratedFiles = {
            'mod.json': generateModJson(modData),
            'CMakeLists.txt': generateCMakeLists(modData),
            'src/main.cpp': generateMainCpp(modData),
            'README.md': generateReadme(modData),
            '.gitignore': generateGitIgnore(),
            'LICENSE': generateLicense(modData),
            'CONTRIBUTING.md': generateContributingMd(modData),
            'assets/.gitkeep': '',
        };
        if (modData.includeCi) {
            files['.github/workflows/main.yml'] = generateCIWorkflow();
        }
        if (modData.logo) {
            const base64Data = modData.logo.split(',')[1];
            files['assets/logo.png'] = base64Data;
        } else {
            if (files['assets/logo.png']) {
                delete files['assets/logo.png'];
            }
        }

        // Keep existing generated assets
        if (generatedFiles) {
             for (const path in generatedFiles) {
                if (path.startsWith('assets/') && path !== 'assets/logo.png' && path !== 'assets/.gitkeep') {
                    files[path] = generatedFiles[path];
                }
            }
        }

        setGeneratedFiles(files);
    }, [modData, generatedFiles]);
    
    useEffect(() => {
        if(modData.id && modData.name && modData.developer) {
            generateFiles();
        } else {
            setGeneratedFiles(null);
        }
    }, [modData, generateFiles]); 

    const handleFormChange = (newModData: ModData) => {
        setModData(newModData);
    };
    
    const handleFileContentChange = (path: string, newContent: string) => {
        setGeneratedFiles(prev => prev ? { ...prev, [path]: newContent } : null);
    };
    
    const handleDownload = async () => {
        if (!generatedFiles) return;
        setIsDownloading(true);
        const zip = new JSZip();
        
        const addFileToZip = (path: string, content: string | undefined) => {
             if (content === undefined) return;
             const isTextFile = ['.json', '.txt', '.cpp', '.md', '.yml', '.gitignore', 'LICENSE', '.gitkeep', '.plist'].some(ext => path.endsWith(ext));
             if (!isTextFile) {
                 zip.file(path, content, { base64: true });
             } else {
                 zip.file(path, content);
             }
        };

        for (const path in generatedFiles) {
             addFileToZip(path, generatedFiles[path]);
        }

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${modData.id || 'geode-mod'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsDownloading(false);
        });
    };
    
    const safeApiCall = useCallback(async <T,>(apiLogic: () => Promise<T>, setLoading: (loading: boolean) => void): Promise<T | null> => {
        if (!ai) {
            setAiError("AI is not available. Please configure your API key.");
            return null;
        }
        setLoading(true);
        setAiError('');
        try {
            return await apiLogic();
        } catch (error) {
            const friendlyMessage = parseAiError(error);
            setAiError(friendlyMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [ai]);
    
    const handleGenerateNameAndId = useCallback(async () => {
        await safeApiCall(async () => {
            const response = await ai!.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: `Based on this mod idea: "${modIdea}", generate a creative mod name and a valid mod ID in the format "com.developer.modname". The developer part should be a generic placeholder. The mod name should be catchy and relevant to Geometry Dash. The ID should be all lowercase. Respond in JSON format with keys "name" and "id".`,
                 config: { responseMimeType: 'application/json' }
            });
            const text = response.text.trim();
            const json = JSON.parse(text);
            setModData(prev => ({ ...prev, name: json.name, id: json.id }));
        }, setIsGeneratingName);
    }, [ai, modIdea, safeApiCall]);

    const handleGenerateDescription = useCallback(async () => {
        await safeApiCall(async () => {
            const response = await ai!.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Write a short, engaging description for a Geometry Dash mod named "${modData.name}". The description should be suitable for a mod marketplace.`,
            });
            setModData(prev => ({ ...prev, description: response.text.trim() }));
        }, setIsGeneratingDesc);
    }, [ai, modData.name, safeApiCall]);

    const handleSuggestTags = useCallback(async () => {
        await safeApiCall(async () => {
            const response = await ai!.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: `Suggest 3-5 relevant, comma-separated tags for a Geometry Dash mod named "${modData.name}" with the description: "${modData.description}". Example tags: gameplay, utility, cosmetic, editor, noclip. Do not add any explanation, just the tags.`,
            });
            setModData(prev => ({ ...prev, tags: response.text.trim() }));
        }, setIsGeneratingTags);
    }, [ai, modData.name, modData.description, safeApiCall]);

    const handleGenerateLogo = useCallback(async () => {
        await safeApiCall(async () => {
            const response = await ai!.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `An icon for a Geometry Dash mod named "${modData.name}". The style should be simple, iconic, geometric, and fit within a square. It should look good at a small size. Transparent background.`,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
                setModData(prev => ({ ...prev, logo: dataUrl }));
                return;
            }

            throw new Error("AI did not return an image.");
        }, setIsGeneratingLogo);
    }, [ai, modData.name, safeApiCall]);

    const handleGenerateSettings = useCallback(async () => {
        await safeApiCall(async () => {
            const response = await ai!.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on the mod name "${modData.name}" and description "${modData.description}", suggest up to 3 relevant settings. For each setting, provide a key (snake_case), a name (Title Case), a brief description, a type ('bool', 'int', 'float', or 'string'), and a sensible default value. Respond ONLY with a valid JSON array.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING },
                                default: { type: Type.STRING },
                            },
                        }
                    }
                }
            });
            const text = response.text.trim();
            const suggestedSettings = JSON.parse(text);
            const newSettings: ModSetting[] = suggestedSettings.map((s: any, i: number) => {
                 let parsedDefault: any;
                 switch(s.type) {
                    case 'bool': parsedDefault = s.default.toLowerCase() === 'true'; break;
                    case 'int': parsedDefault = parseInt(s.default, 10) || 0; break;
                    case 'float': parsedDefault = parseFloat(s.default) || 0.0; break;
                    default: parsedDefault = s.default;
                 }
                return { id: `setting-ai-${Date.now()}-${i}`, key: s.key, name: s.name, description: s.description, type: s.type, default: parsedDefault };
            });
            setModData(prev => ({ ...prev, settings: [...prev.settings, ...newSettings] }));
        }, setIsGeneratingSettings);
    }, [ai, modData.name, modData.description, safeApiCall]);
    
    const handleSendMessage = useCallback(async (message: string) => {
        if (!chat || !ai) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        
        const fileList = generatedFiles ? `\n\nFor context, here are the current files in the project:\n${Object.keys(generatedFiles).join('\n')}` : '';
        const messageWithContext = message + fileList;

        await safeApiCall(async () => {
            const request: any = { message: messageWithContext };
            if (isDeepThinkEnabled) {
                // Use the max budget for gemini-2.5-flash for more complex reasoning.
                request.config = { thinkingConfig: { thinkingBudget: 24576 } };
            }

            const response = await chat.sendMessage(request);
            
            // Handle function calls for asset generation
            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const funcCall of response.functionCalls) {
                    if (funcCall.name === 'generateImageAndPlist' && funcCall.args) {
                        const { prompt, fileName, spriteNames } = funcCall.args as { prompt: string; fileName: string; spriteNames: string[] };

                        // 1. Generate Image
                        const imageResponse = await ai.models.generateImages({
                            model: 'imagen-4.0-generate-001',
                            prompt: `A high-quality asset for a Geometry Dash mod. The asset is for: "${prompt}". The image MUST have a transparent background. The style should be clean, with sharp edges and vibrant colors. Think simple shapes, glowing effects, and a modern, slightly futuristic look.`,
                            config: { numberOfImages: 1, aspectRatio: '1:1' },
                        });
                        const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;

                        // 2. Generate Plist
                        const plistPrompt = `Generate a Cocos2d .plist XML file for a spritesheet named '${fileName}'. The spritesheet contains the following sprites: ${spriteNames.join(', ')}. Assume the sprites are arranged in a row. Create frames for each sprite name. You don't know the exact coordinates, so provide plausible placeholder coordinates and sizes for each frame. The format should be the standard Cocos2d plist format with a metadata section and a frames section.`;
                        const plistResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: plistPrompt });
                        const plistContent = plistResponse.text.trim().replace(/```xml\n|```/g, ''); // Clean up markdown fences if any

                        // 3. Update file state
                        setGeneratedFiles(prev => {
                            const newFiles = prev ? { ...prev } : {};
                             const sanitizedFileName = (fileName.endsWith('.png') ? fileName : `${fileName}.png`).replace(/[^a-z0-9-_\.]/gi, '-').toLowerCase();
                             const plistFileName = sanitizedFileName.replace('.png', '.plist');
                             delete newFiles['assets/.gitkeep'];
                             newFiles[`assets/${sanitizedFileName}`] = base64ImageBytes;
                             newFiles[`assets/${plistFileName}`] = plistContent;
                            return newFiles;
                        });

                        // 4. Add confirmation to chat
                        const confirmationMessage: ChatMessage = { role: 'model', parts: [{ text: `Okay! I've created the asset \`${fileName}\` and its \`.plist\` file and added them to your project's \`assets\` folder.` }] };
                        setChatHistory(prev => [...prev, confirmationMessage]);
                        return; // Exit after handling function call
                    }
                }
            }
            
            // Handle text/code generation
            const responseText = response.text;
            let modelMessage: ChatMessage;

            try {
                const parsedJson = JSON.parse(responseText);
                // Handle new multi-file format
                if (parsedJson.files && Array.isArray(parsedJson.files)) {
                    let filePaths: string[] = [];
                    setGeneratedFiles(prev => {
                        const newFiles = prev ? { ...prev } : {};
                        parsedJson.files.forEach((file: { filePath: string; fileContent: string; }) => {
                             if (file.filePath && file.fileContent) {
                                newFiles[file.filePath] = file.fileContent;
                                filePaths.push(`\`${file.filePath}\``);
                             }
                        });
                        return newFiles;
                    });
                    
                    modelMessage = { role: 'model', parts: [{ text: `Okay! I've created or updated the following file(s): ${filePaths.join(', ')}.` }] };

                // Handle old single-file format for backward compatibility
                } else if (parsedJson.filePath && typeof parsedJson.filePath === 'string' && parsedJson.fileContent && typeof parsedJson.fileContent === 'string') {
                    setGeneratedFiles(prev => {
                        const newFiles = prev ? { ...prev } : {};
                        newFiles[parsedJson.filePath] = parsedJson.fileContent;
                        return newFiles;
                    });
                    
                    modelMessage = { role: 'model', parts: [{ text: `Okay! I've created the file \`${parsedJson.filePath}\` and added it to your project.` }] };
                } else {
                    throw new Error("JSON format is not a recognized file generation format.");
                }
            } catch (e) {
                // Not a JSON for file generation, treat as plain text
                modelMessage = { role: 'model', parts: [{ text: responseText }] };
            }
            
            setChatHistory(prev => [...prev, modelMessage]);

        }, setIsChatting);
    }, [chat, ai, chatHistory, safeApiCall, generatedFiles, isDeepThinkEnabled]);
    
    const handleAskGigiToExplain = useCallback(async (fileName: string) => {
        if (!generatedFiles || !generatedFiles[fileName] || String(generatedFiles[fileName]).length > 10000) {
             const message = `Gigi, can you tell me the general purpose of a file named '${fileName}' in a Geode mod project?`;
             await handleSendMessage(message);
        } else {
             const fileContent = generatedFiles[fileName];
             const message = `Gigi, please explain what this file does in the context of a Geode mod. The file is named '${fileName}'. Here is the content:\n\n\`\`\`\n${fileContent}\n\`\`\``;
             await handleSendMessage(message);
        }
    }, [generatedFiles, handleSendMessage]);


    return (
        <>
            {showSplash && <StartupAnimation onAnimationEnd={() => setShowSplash(false)} />}
            <div className={`h-full overflow-y-auto bg-geode-dark p-4 sm:p-6 lg:p-8 ${!showSplash ? 'animate-fade-in' : 'opacity-0'}`}>
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-8">
                        <div className="flex justify-center items-center gap-4">
                            <GeodeIcon className="h-12 w-12 text-geode-teal" />
                            <h1 className="text-4xl font-extrapold text-geode-light">
                                Geode Mod Creator
                            </h1>
                        </div>
                        <p className="mt-2 text-geode-overlay">Create and customize your Geometry Dash mods with the power of AI.</p>
                    </header>
                    
                    <div className="flex justify-center mb-6">
                        <button onClick={() => setIsLivePreviewModalOpen(true)} className="bg-geode-blue text-geode-crust font-bold py-2 px-6 rounded-md hover:bg-opacity-90 transition-all">
                            Live Preview
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <ModForm
                                modData={modData}
                                onFormChange={handleFormChange}
                                onDownload={handleDownload}
                                isDownloading={isDownloading}
                                aiEnabled={aiEnabled}
                                modIdea={modIdea}
                                onModIdeaChange={setModIdea}
                                onGenerateNameAndId={handleGenerateNameAndId}
                                isGeneratingName={isGeneratingName}
                                onGenerateDescription={handleGenerateDescription}
                                isGeneratingDesc={isGeneratingDesc}
                                onSuggestTags={handleSuggestTags}
                                isGeneratingTags={isGeneratingTags}
                                onGenerateLogo={handleGenerateLogo}
                                isGeneratingLogo={isGeneratingLogo}
                                onGenerateSettings={handleGenerateSettings}
                                isGeneratingSettings={isGeneratingSettings}
                                aiError={aiError}
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <CodeWorkspace 
                                files={generatedFiles} 
                                onFileContentChange={handleFileContentChange}
                                aiEnabled={aiEnabled}
                                onAskGigiToExplain={handleAskGigiToExplain}
                                isChatting={isChatting}
                                onRunMod={() => setIsHowToRunModalOpen(true)}
                            />
                            <ChatHistory 
                                aiEnabled={aiEnabled}
                                history={chatHistory}
                                isChatting={isChatting}
                                onSendMessage={handleSendMessage}
                                isDeepThinkEnabled={isDeepThinkEnabled}
                                onToggleDeepThink={handleToggleDeepThink}
                            />
                        </div>
                    </div>
                </div>
                
                <HowToRunModal isOpen={isHowToRunModalOpen} onClose={() => setIsHowToRunModalOpen(false)} />
                <LivePreviewModal 
                    isOpen={isLivePreviewModalOpen} 
                    onClose={() => setIsLivePreviewModalOpen(false)} 
                    modData={modData}
                    onShowHowTo={() => {
                        setIsLivePreviewModalOpen(false);
                        setIsHowToRunModalOpen(true);
                    }}
                />
            </div>
        </>
    );
};

export default App;