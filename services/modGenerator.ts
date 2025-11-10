import type { ModData } from '../types';

export const generateModJson = (data: ModData): string => {
    const gd: Record<string, string> = {};
    if (data.platforms.win) gd.win = data.gdVersion || "*";
    if (data.platforms.mac) gd.mac = data.gdVersion || "*";
    if (data.platforms.android) gd.android = data.gdVersion || "*";
    if (data.platforms.ios) gd.ios = data.gdVersion || "*";

    const modJson: any = {
        "geode": data.geodeVersion || "2.0.0-beta.26",
        "gd": gd,
        "id": data.id || "com.developer.modname",
        "name": data.name || "My Awesome Mod",
        "version": data.version || "v1.0.0",
        "developer": data.developer || "Your Name",
        "description": data.description || "A new mod for Geometry Dash",
    };
    
    if (data.logo) modJson.icon = "logo.png";
    if (data.repository) modJson.repository = data.repository;
    if (data.providesApi) modJson.api = true;
    if (data.earlyLoad) modJson['early-load'] = true;

    if (data.tags) {
        modJson.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    if (data.dependencies) {
        const dependencies = data.dependencies
            .split(',')
            .map(depString => depString.trim())
            .filter(depString => depString)
            .map(depString => {
                const lastAt = depString.lastIndexOf('@');
                // Check if '@' is present and not the first character
                if (lastAt > 0) {
                    const id = depString.substring(0, lastAt);
                    const version = depString.substring(lastAt + 1);
                    return { id, required: true, version: version || "*" };
                } else {
                    return { id: depString, required: true, version: "*" };
                }
            });

        if (dependencies.length > 0) {
            modJson.dependencies = dependencies;
        }
    }

    if (data.settings && data.settings.length > 0) {
        modJson.settings = {};
        data.settings.forEach(setting => {
            // Geode expects the default value to match the type
            let defaultValue: any;
            switch(setting.type) {
                case 'bool':
                    defaultValue = !!setting.default;
                    break;
                case 'int':
                    defaultValue = parseInt(String(setting.default), 10) || 0;
                    break;
                case 'float':
                    defaultValue = parseFloat(String(setting.default)) || 0.0;
                    break;
                case 'string':
                    defaultValue = String(setting.default);
                    break;
            }

            modJson.settings[setting.key] = {
                name: setting.name,
                description: setting.description,
                type: setting.type,
                default: defaultValue
            };
        });
    }


    return JSON.stringify(modJson, null, 4);
};

export const generateCMakeLists = (data: ModData): string => {
    return `cmake_minimum_required(VERSION 3.13)

# Get Geode and its settings
find_package(Geode REQUIRED)

# Add your project, its sources and link it to Geode
add_geode_mod(${data.id || "com.developer.modname"}
	VERSION ${data.version || "v1.0.0"}
	ID "${data.id || "com.developer.modname"}"
	SOURCES
		resources/main.cpp
	RESOURCES
		assets
)
`;
};

const generateMenuLayerCpp = (data: ModData): string => {
    const modName = data.name || "My Awesome Mod";
    return `#include <Geode/Geode.hpp>
#include <Geode/modify/MenuLayer.hpp>

using namespace geode::prelude;

// Adds a label to the main menu
class $modify(MyMenuLayer, MenuLayer) {
	bool init() {
		if (!MenuLayer::init()) {
			return false;
		}

		try {
			// Log that the mod is initializing
			log::info("Initializing ${modName}");

			auto myLabel = CCLabelBMFont::create("Hello from ${modName}!", "bigFont.fnt");

			auto winSize = CCDirector::sharedDirector()->getWinSize();
			myLabel->setPosition(winSize.width / 2, winSize.height / 2 + 100);
			myLabel->setScale(0.7f);
			this->addChild(myLabel);
		} catch (const std::exception& e) {
			geode::log::error("An error occurred during ${modName} initialization: {}", e.what());
		}

		return true;
	}
};
`;
};

const generatePlayLayerCpp = (data: ModData): string => {
    return `#include <Geode/Geode.hpp>
#include <Geode/modify/PlayLayer.hpp>

using namespace geode::prelude;

// Shows a notification when the player dies
class $modify(PlayLayer) {
    void onQuit() {
        // Call the original function so the game doesn't crash
        PlayLayer::onQuit();

        try {
            // Log to the console and show a notification
            log::info("Player quit level, showing notification.");
            Notification::create("You died!", CCSprite::create("GJ_deleteBtn_001.png"))->show();
        } catch (const std::exception& e) {
            geode::log::error("An error occurred in PlayLayer::onQuit hook: {}", e.what());
        }
    }
};
`;
};


const generateSettingsLayerCpp = (data: ModData): string => {
    const modId = data.id || 'com.developer.modname';
    const modName = data.name || 'My Mod';

    const firstBoolSetting = data.settings.find(s => s.type === 'bool');

    let menuLayerModification = `
// This adds the "Hello World" label to the main menu, but only if a boolean setting is enabled.
class $modify(MyMenuLayerWithSettings, MenuLayer) {
	bool init() {
		if (!MenuLayer::init()) {
			return false;
		}
		
		try {
`;

    if (firstBoolSetting) {
        menuLayerModification += `			// Check if the setting is enabled
			if (Mod::get()->getSettingValue<bool>("${firstBoolSetting.key}")) {
				log::info("Setting '${firstBoolSetting.key}' is enabled, adding label.");
				auto myLabel = CCLabelBMFont::create("Hello from ${modName}!", "bigFont.fnt");
				auto winSize = CCDirector::sharedDirector()->getWinSize();
				myLabel->setPosition(winSize.width / 2, winSize.height / 2 + 100);
				myLabel->setScale(0.7f);
				this->addChild(myLabel);
			}
`;
    } else {
        menuLayerModification += `			// You can add logic here that depends on your settings.
			// For example, create a boolean setting in the form to toggle this label.
			auto myLabel = CCLabelBMFont::create("Hello from ${modName}!", "bigFont.fnt");
			auto winSize = CCDirector::sharedDirector()->getWinSize();
			myLabel->setPosition(winSize.width / 2, winSize.height / 2 + 100);
			myLabel->setScale(0.7f);
			this->addChild(myLabel);
`;
    }

    menuLayerModification += `		} catch (const std::exception& e) {
			geode::log::error("An error occurred in MyMenuLayerWithSettings::init: {}", e.what());
		}

		return true;
	}
};`;

    let settingsUiGeneration = '';
    if (data.settings.length > 0) {
        data.settings.forEach((setting, index) => {
            const yPos = `contentSize.height - 40.f - (40.f * ${index})`;
            switch (setting.type) {
                case 'bool':
                    settingsUiGeneration += `
                    auto toggle_${index} = geode::Checkbox::create("${setting.name}", nullptr);
                    popup->addToggle(toggle_${index}, "${modId}", "${setting.key}");
                    toggle_${index}->setPosition(contentSize.width / 2, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(toggle_${index});
                    `;
                    break;
                case 'int':
                    settingsUiGeneration += `
                    auto input_label_${index} = CCLabelBMFont::create("${setting.name}", "bigFont.fnt");
                    input_label_${index}->setScale(0.5f);
                    input_label_${index}->setPosition(contentSize.width / 2 - 80.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_label_${index});

                    auto input_${index} = geode::InputNode::create(100.f, "Number");
                    input_${index}->getInput()->setAllowedChars("0123456789-");
                    popup->addInput(input_${index}, "${modId}", "${setting.key}");
                    input_${index}->setPosition(contentSize.width / 2 + 30.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_${index});
                    `;
                    break;
                case 'float':
                     settingsUiGeneration += `
                    auto input_label_${index} = CCLabelBMFont::create("${setting.name}", "bigFont.fnt");
                    input_label_${index}->setScale(0.5f);
                    input_label_${index}->setPosition(contentSize.width / 2 - 80.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_label_${index});

                    auto input_${index} = geode::InputNode::create(100.f, "Number");
                    input_${index}->getInput()->setAllowedChars("0123456789.-");
                    popup->addInput(input_${index}, "${modId}", "${setting.key}");
                    input_${index}->setPosition(contentSize.width / 2 + 30.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_${index});
                    `;
                    break;
                case 'string':
                     settingsUiGeneration += `
                    auto input_label_${index} = CCLabelBMFont::create("${setting.name}", "bigFont.fnt");
                    input_label_${index}->setScale(0.5f);
                    input_label_${index}->setPosition(contentSize.width / 2 - 80.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_label_${index});

                    auto input_${index} = geode::InputNode::create(150.f, "Text");
                    popup->addInput(input_${index}, "${modId}", "${setting.key}");
                    input_${index}->setPosition(contentSize.width / 2 + 55.f, ${yPos});
                    popup->getBJSPopup()->m_mainLayer->addChild(input_${index});
                    `;
                    break;
            }
        });
    } else {
        settingsUiGeneration = `
                    auto label = CCLabelBMFont::create("This mod has no settings.", "bigFont.fnt");
                    label->setPosition(contentSize.width / 2, contentSize.height / 2);
                    label->setScale(0.6f);
                    popup->getBJSPopup()->m_mainLayer->addChild(label);
        `;
    }


    return `#include <Geode/Geode.hpp>
#include <Geode/modify/MenuLayer.hpp>
#include <Geode/ui/GeodeUI.hpp>
#include <Geode/ui/InputNode.hpp>
#include <Geode/ui/Checkbox.hpp>

using namespace geode::prelude;
${menuLayerModification}

// This function is called when the mod is loaded.
// It is used to create the settings UI.
$execute {
    // We use onModsLoaded instead of just running the code to make sure
    // the mod list is ready and the settings button can be created.
    geode::ui::onModsLoaded([] {
        geode::ui::createSettingsPopup(
            "${modId}",
            [](auto popup) {
                // This is the function that creates the UI.
                // It is called every time the user opens your settings.
                try {
                    log::info("Creating settings UI for ${modId}");
                    // First, we get the content size of the popup.
                    // This is used to position our elements.
                    auto contentSize = popup->getBJSPopup()->m_mainLayer->getContentSize();
                    
                    // The following UI is generated automatically based on your settings.
                    ${settingsUiGeneration}

                    return true;
                } catch (const std::exception& e) {
                    geode::log::error("Failed to create settings UI for ${modId}: {}", e.what());
                    return false; // Indicate failure
                }
            }
        );
    });
}
`;
};

export const generateMainCpp = (data: ModData): string => {
    switch(data.cppTemplate) {
        case 'playlayer':
            return generatePlayLayerCpp(data);
        case 'settings':
            return generateSettingsLayerCpp(data);
        case 'menulayer':
        default:
            return generateMenuLayerCpp(data);
    }
};

export const generateCIWorkflow = (): string => {
    return `name: Build Mod

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest]

    runs-on: \${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Setup Geode
        uses: geode-sdk/setup-geode-sdk@v1
        with:
          # This is the token for your PERSONAL ACCESS TOKEN
          # You can get one here: https://github.com/settings/tokens
          # You only need the 'repo' scope
          token: \${{ secrets.GEODE_SDK_TOKEN }}

      - name: Build
        run: geode build

      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: \${{ matrix.os }} Build
          path: build/*.geode
`;
};

export const generateReadme = (data: ModData): string => {
    return `# ${data.name || 'My Awesome Mod'}

A new mod for Geometry Dash, created by ${data.developer || 'Your Name'}.

${data.description || 'A brief summary of what your mod does.'}

## Project Structure

*   \`mod.json\`: The manifest file for your mod. Contains metadata like the name, developer, version, and dependencies.
*   \`CMakeLists.txt\`: The build script for your mod.
*   \`resources/\`: Contains your C++ source code.
    *   \`main.cpp\`: The main entry point for your mod.
*   \`assets/\`: Contains assets for your mod (spritesheets, images, sounds, etc.).
*   \`LICENSE\`: The license for your mod.
*   \`CONTRIBUTING.md\`: Guidelines for contributing to your mod.

This mod was generated with the [Geode Mod Creator](https://geode-sdk.org/creator).
`;
}

export const generateGitIgnore = (): string => {
    return `build/
bin/
*.geode
*.dll
*.dylib
*.so
*.zip
*.rar
*.7z

# Visual Studio
.vs/
*.VC.db
*.VC.opendb
*.*.user

# CLion
.idea/

# VSCode
.vscode/
`;
}

export const generateLicense = (data: ModData): string => {
    const year = new Date().getFullYear();
    const developer = data.developer || 'Your Name';
    return `MIT License

Copyright (c) ${year} ${developer}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
};

export const generateContributingMd = (data: ModData): string => {
    const modName = data.name || 'this project';
    const repoUrl = data.repository ? data.repository.replace(/\.git$/, '') : 'https://github.com/your/repo';
    const issuesUrl = data.repository ? `${repoUrl}/issues` : '#';
    const newIssueUrl = data.repository ? `${repoUrl}/issues/new` : '#';

    return `# Contributing to ${modName}

First off, thank you for considering contributing to ${modName}! It's people like you that make the Geode modding community such a great place.

## How Can I Contribute?

### Reporting Bugs

- Ensure the bug was not already reported by searching on GitHub under [Issues](${issuesUrl}).
- If you're unable to find an open issue addressing the problem, [open a new one](${newIssueUrl}). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Open a new issue to discuss your new feature idea.
- Be sure to provide a clear and detailed explanation of the feature, its potential benefits, and any implementation details you have in mind.

### Pull Requests

1. Fork the repo and create your branch from \`main\`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints.
5. Issue that pull request!

## Styleguides

Please try to follow the coding style of the existing codebase. This makes it easier for everyone to read and understand the code.

We look forward to your contributions!
`;
};