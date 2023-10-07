import { UIElement } from '../../frameworks/UserInterface_JS/UIElement.js';
import { IAPlayer } from './IAPlayer.js';

export class IAEngine extends UIElement {
    #LOAD_SCRIPT = 'loadScript';
    //#GOTO_SCENE = 'gotoScene';
    #PARSE_PROMPT = 'parsePrompt';
    #PARSE_CHOICE = 'parseChoice';
    #PARSE_GOTO = 'parseGoto';
    static ATTRIBUTE_ID = 'id';
    static ATTRIBUTE_SCENE_ID = 'sceneID';
    static ATTRIBUTE_NODE_ID = 'nodeID';
    static ATTRIBUTE_PROMPT_ID = 'promptID';
    static ATTRIBUTE_CHOICE_ID = 'choiceID';
    static ATTRIBUTE_GOTO_ID = 'gotoID';
    static ATTRIBUTE_CONDITION_ID = 'conditionID';
    static ATTRIBUTE_MODIFYVAR_ID = 'modifyVarID';
    static ATTRIBUTE_FILE = 'file';
    static ATTRIBUTE_VAR_ID = 'varID';
    static ATTRIBUTE_OPERATOR = 'operator';
    static ATTRIBUTE_COMMAND = 'command';
    static ATTRIBUTE_VALUE = 'value';
    static ELEMENT_VAR = 'var';
    static ELEMENT_SCENE = 'scene';
    static ELEMENT_NODE = 'node';
    static ELEMENT_PROMPT = 'prompt';
    static ELEMENT_MODIFYVAR = 'modifyVar';
    static ELEMENT_CHOICE = 'choice';
    static ELEMENT_GOTO = 'goto';
    static ELEMENT_CONDITION = 'condition';
    static getScene(sceneID, script) {
        const sceneList = script.querySelectorAll(`Scenes ${IAEngine.ELEMENT_SCENE}[id="${sceneID}"]`);
        const l = sceneList.length;
        if (l === 1) return sceneList[0];
        else if (l > 1) throw new Error(`Multiple scenes with the same id "${sceneID}" exist in <Scenes>.`);
        else throw new Error(`A scene with id "${sceneID}" does not exist in <Scenes>.`);
    }
    static getNodeFromXML(nodeID, scene) {
        const nodeList = scene.querySelectorAll(`node[id="${nodeID}"]`);
        const l = nodeList.length;
        if (l === 1) return nodeList[0];
        else if (l > 1) throw new Error(`Multiple nodes with the same id "${nodeID}" exist in scene "${scene.getAttribute(IAEngine.ATTRIBUTE_ID)}".`);
        else throw new Error(`Node "${nodeID}" does not exist in scene "${scene.getAttribute(IAEngine.ATTRIBUTE_ID)}".`);
    }
    static getNodeFromString(nodeID, sceneID, script) {
        const scene = IAEngine.getScene(sceneID, script);
        return this.getNodeFromXML(nodeID, scene);
    }
    static getChildElement(childID, childType, parent) {
        const list = parent.querySelectorAll(childType);
        const matches = [];
        list.forEach(child => {
            const testID = child.getAttribute(IAEngine.ATTRIBUTE_ID);
            if (testID === childID) matches.push(child);
        });
        const l = matches.length;
        if (l === 1) return matches[0];
        else {
            const parentPrefix = `Parent "${parent.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (list.length === 0 ) throw new Error(`${parentPrefix} does not have any children of type <${childType}>.`);
            else if (l === 0) throw new Error(`${parentPrefix} has children of type <${childType}>, but there is no child with id "${childID}".`);
            else if (l > 1) throw new Error(`${parentPrefix} has children of type <${childType}>, but there is more than one child with id "${childID}".`);
        }
    }
    static verifyPrompt(prompt, script) {
        if (prompt.hasAttribute(IAEngine.ATTRIBUTE_FILE)) {
            console.log(`    ${prompt.outerHTML}`);
            return prompt;
        } else {
            const promptID = prompt.getAttribute(IAEngine.ATTRIBUTE_PROMPT_ID);
            const nodeID = prompt.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = prompt.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const promptPrefix = `Prompt "${prompt.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (promptID && nodeID && sceneID) {
                console.log(`${promptPrefix} attempting to reference another <${IAEngine.ELEMENT_PROMPT}> with ${IAEngine.ATTRIBUTE_PROMPT_ID}="${promptID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                prompt = IAEngine.getChildElement(promptID, IAEngine.ELEMENT_PROMPT, node);
                return this.verifyPrompt(prompt, script);
            } else throw new Error(`${promptPrefix} does not have a "${IAEngine.ATTRIBUTE_FILE}" attribute nor does it have "${IAEngine.ATTRIBUTE_PROMPT_ID}", "${$IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyCondition(condition, script) { // Verify the condition, which may have a parent that is a prompt, choice, or goto.
        if (condition.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) && condition.hasAttribute(IAEngine.ATTRIBUTE_OPERATOR) && condition.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) {
            console.log(`Verified: ${condition.outerHTML}`);
            return condition;
        } else {
            const conditionID = condition.getAttribute(IAEngine.ATTRIBUTE_CONDITION_ID);
            const nodeID = condition.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = condition.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const conditionPrefix = `Condition "${condition.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (conditionID && nodeID && sceneID) {
                console.log(`${conditionPrefix} attempting to reference another <${IAEngine.ELEMENT_CONDITION}> with ${IAEngine.ATTRIBUTE_CONDITION_ID}="${conditionID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                let parentID;
                let parentType;
                let grandParentID;
                let grandParentType;
                const promptID = condition.getAttribute(IAEngine.ATTRIBUTE_PROMPT_ID);
                if (promptID) {
                    parentID = promptID;
                    parentType = IAEngine.ELEMENT_PROMPT;
                } else {
                    const choiceID = condition.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
                    const gotoID = condition.getAttribute(IAEngine.ATTRIBUTE_GOTO_ID);
                    if (choiceID && !gotoID) {
                        parentID = choiceID;
                        parentType = IAEngine.ELEMENT_CHOICE;
                    } else if (gotoID && !choiceID) {
                        parentID = gotoID;
                        parentType = IAEngine.ELEMENT_GOTO;
                    } else if (gotoID && choiceID) {
                        parentID = gotoID;
                        parentType = IAEngine.ELEMENT_GOTO;
                        grandParentID = choiceID;
                        grandParentType = IAEngine.ELEMENT_CHOICE;
                    } else throw new Error(`${conditionPrefix}'s reference was invalid because it does not have "${IAEngine.ATTRIBUTE_PROMPT_ID}", "${IAEngine.ATTRIBUTE_CHOICE_ID}", or "${IAEngine.ATTRIBUTE_GOTO_ID}" attributes.`);
                }
                let grandparentXML = IAEngine.getNodeFromString(nodeID, sceneID, script);
                if (grandParentID && grandParentType) grandparentXML = IAEngine.getChildElement(grandParentID, grandParentType, grandparentXML);
                const parentXML = IAEngine.getChildElement(parentID, parentType, grandparentXML);
                condition = IAEngine.getChildElement(conditionID, IAEngine.ELEMENT_CONDITION, parentXML);
                return this.verifyCondition(condition, script);
            } else throw new Error(`${conditionPrefix} does not have "${IAEngine.ATTRIBUTE_VAR_ID}", "${IAEngine.ATTRIBUTE_OPERATOR}" and "${IAEngine.ATTRIBUTE_VALUE}" attributes nor does it have "${IAEngine.ATTRIBUTE_CONDITION_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyModifyVar(modifyVar, script) {
        if (modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_COMMAND) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) {
            console.log(`Verified: ${modifyVar.outerHTML}`);
            return modifyVar;
        } else {
            const modifyVarID = prompt.getAttribute(IAEngine.ATTRIBUTE_MODIFYVAR_ID);
            const nodeID = prompt.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = prompt.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const modifyVarPrefix = `ModifyVar "${modifyVar.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (modifyVarID && nodeID && sceneID) {
                console.log(`${modifyVarPrefix} attempting to reference another <${IAEngine.ELEMENT_MODIFYVAR}> with ${IAEngine.ATTRIBUTE_PROMPT_ID}="${modifyVarID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                let parentID;
                let parentType;
                const promptID = condition.getAttribute(IAEngine.ATTRIBUTE_PROMPT_ID);
                if (promptID) {
                    parentID = promptID;
                    parentType = IAEngine.ELEMENT_PROMPT;
                } else {
                    const choiceID = condition.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
                    if (choiceID) {
                        parentID = choiceID;
                        parentType = IAEngine.ELEMENT_CHOICE;
                    } else throw new Error(`${modifyVarPrefix}'s reference was invalid because it does not have a "${IAEngine.ATTRIBUTE_PROMPT_ID}" or "${IAEngine.ATTRIBUTE_CHOICE_ID}" attribute.`);
                }
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                const parentXML = IAEngine.getChildElement(parentID, parentType, node);
                modifyVar = IAEngine.getChildElement(modifyVarID, IAEngine.ELEMENT_MODIFYVAR, parentXML);
                return this.verifyModifyVar(modifyVar, script);
            } else throw new Error(`${modifyVarPrefix} does not have "${IAEngine.ATTRIBUTE_VAR_ID}", "${IAEngine.ATTRIBUTE_COMMAND}", and "${IAEngine.ATTRIBUTE_VALUE}" attributes nor does it have "${IAEngine.ATTRIBUTE_MODIFYVAR_ID}", "${$IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyChoice(choice, script) {
        const gotoList = choice.querySelectorAll(IAEngine.ELEMENT_GOTO);
        if (gotoList.length > 0) {
            console.log(`Verified: ${choice.outerHTML}`);
            return choice;
        } else {
            const choiceID = choice.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
            const nodeID = choice.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = choice.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const choicePrefix = `Choice "${choice.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (choiceID && nodeID && sceneID) {
                console.log(`${choicePrefix} attempting to reference another <${IAEngine.ELEMENT_CHOICE}> with ${IAEngine.ATTRIBUTE_CHOICE_ID}="${choiceID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                choice = IAEngine.getChildElement(choiceID, IAEngine.ELEMENT_CHOICE, node);
                return this.verifyChoice(choice, script);
            } else throw new Error(`${choicePrefix} does not have any <${IAEngine.ELEMENT_GOTO}> children nor does it have "${IAEngine.ATTRIBUTE_CHOICE_ID}", "${$IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyGoto(goto, indent, script) { // Verify the goto, which may have a parent that is a node or a choice
        const gotoID = goto.getAttribute(IAEngine.ATTRIBUTE_GOTO_ID);
        const nodeID = goto.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
        const sceneID = goto.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
        if (!gotoID && (nodeID || sceneID)) {
            console.log(`${indent}${goto.outerHTML}`);
            return goto;
        } else {
            const gotoPrefix = `Goto "${goto.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (gotoID && nodeID && sceneID) {
                console.log(`${gotoPrefix} attempting to reference another <${IAEngine.ELEMENT_GOTO}> with ${IAEngine.ATTRIBUTE_GOTO_ID}="${gotoID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                const targetParent = IAEngine.getNodeFromString(nodeID, sceneID, script);
                const choiceID = goto.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
                if (choiceID) targetParent = IAEngine.getChildElement(choiceID, IAEngine.ELEMENT_CHOICE, targetParent);
                goto = IAEngine.getChildElement(gotoID, IAEngine.ELEMENT_GOTO, targetParent);
                return this.verifyGoto(goto, sourceParent, script);
            } else if (gotoID && !(nodeID && sceneID)) throw new Error(`${gotoPrefix}'s reference was invalid because it does not have a "${IAEngine.ATTRIBUTE_NODE_ID}", "${IAEngine.ATTRIBUTE_SCENE_ID}", or both.`);
            else throw new Error(`${gotoPrefix} is invalid.`);
        }
    }
    static evaluateXML(xml, script, variables) {
        const conditionList = xml.querySelectorAll(IAEngine.ELEMENT_CONDITION);
        if (conditionList.length > 0) {
            for (let condition of conditionList) {
                condition = IAEngine.verifyCondition(condition, script);
                const varID = condition.getAttribute(IAEngine.ATTRIBUTE_VAR_ID);
                const operator = condition.getAttribute(IAEngine.ATTRIBUTE_OPERATOR);
                const value = parseFloat(condition.getAttribute(IAEngine.ATTRIBUTE_VALUE));
                if (!IAEngine.evaluate(variables, varID, operator, value)) return false;
            };
        }
        return true;
    }
    static evaluate(variables, varID, operator, value) {
        const testValue = variables.getVar(varID);
        switch (operator) {
            case '==':
                return testValue === value;
            case '!=':
                return testValue !== value;
            case '<':
                return testValue < value;
            case '<=':
                return testValue <= value;
            case '>':
                return testValue > value;
            case '>=':
                return testValue >= value;
            case '=':
                throw new Error(`Operator "=" is invalid. Did you mean "==" instead?`);
            default:
                throw new Error(`Operator "${operator}" is invalid.`);
        }
    }

    constructor(projectName) {
        super();
        this.projectName = projectName;
        this.player = new IAPlayer();
        this.player.playButton.upFunction = this.playPromptAudio;
        this.appendChild(this.player);
        this.script = null;
        this.variables = new Variables();
        this.nextSceneName = null;
        this.nextNodeName = null;
        this.currentScene = null;
        this.currentNode = null;
        this.promptArray = [];
        this.audioArray = [];
        this.choiceArray = [];
        this.downloadSize = 0;
        this.firstAudio = true;
    }
    exec() {
        this.addEventListener(this.#LOAD_SCRIPT,this.onLoadScript);
        this.loadScript('script.iae')
            .then((xmlData) => {
                this.script = xmlData;
                this.dispatchEventWith(this.#LOAD_SCRIPT);
            })
            .catch((error) => {
                console.error(error);
            });
    }
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    const xmlText = xhr.responseText;
                    const parser = new DOMParser();
                    const xmlData = parser.parseFromString(xmlText, 'application/xml');
                    resolve(xmlData);
                } else reject(new Error('Error loading XML file.'));
            };
            xhr.onerror = () => {
                reject(new Error('Network error.'));
            };
            xhr.send();
        });
    }
    onLoadScript() {
        this.removeEventListener(this.#LOAD_SCRIPT,this.onLoadScript);
        this.player.setTitleText(this.script.querySelector('InteractiveAudioAdventure').getAttribute('title'));
        this.parseScript();
    }
    parseScript() {
        this.initVars();
        this.initScene();
    }
    initVars() {
        this.variables.reset();
        const variablesList = this.script.querySelector('Variables');
        if (variablesList) {
            const varsList = variablesList.querySelectorAll(IAEngine.ELEMENT_VAR);
            varsList.forEach(varElement => {
                const id = varElement.getAttribute(IAEngine.ATTRIBUTE_ID);
                const value = parseFloat(varElement.getAttribute(IAEngine.ATTRIBUTE_VALUE));
                this.variables.setVar(id, value);
            });
        }
    }
    initScene() {
        this.nextSceneName = 'Title';
        this.gotoNext();
    }
    gotoNext() {
        if (!this.currentScene || this.currentScene.getAttribute(IAEngine.ATTRIBUTE_ID) !== this.nextSceneName) {
            this.addEventListener(this.END_SCENE,this.gotoScene);
            this.dispatchEventWith(this.END_SCENE);
        } else this.gotoNode();
    }
    gotoScene() {
        this.removeEventListener(this.END_SCENE,this.gotoScene);
        this.currentScene = IAEngine.getScene(this.nextSceneName, this.script);
        this.player.setSceneText(this.getSceneText(this.currentScene));
        console.log(`<${IAEngine.ELEMENT_SCENE} id="${this.currentScene.getAttribute(IAEngine.ATTRIBUTE_ID)}">`);
        this.gotoNode();
    }
    getSceneText(scene) {
        const firstChildNode = scene.firstChild;
        if (firstChildNode && firstChildNode.nodeType === Node.TEXT_NODE && firstChildNode.parentNode === scene) return firstChildNode.textContent.trim();
        else return '';
    }
    gotoNode() {
        if (this.nextNodeName === null) this.nextNodeName = 'default';
        this.currentNode = IAEngine.getNodeFromXML(this.nextNodeName, this.currentScene);
        this.nextNodeName = null;
        this.promptArray.length = this.choiceArray.length = 0;
        this.downloadSize = 0;
        console.log(`  <${IAEngine.ELEMENT_NODE} id="${this.currentNode.getAttribute(IAEngine.ATTRIBUTE_ID)}">`);
        this.prepParsePrompt();
    }
    prepParsePrompt() {
        this.addEventListener(this.#PARSE_PROMPT,this.onParsePrompt);
        this.parsePromptList();
    }
    parsePromptList() {
        const promptList = this.currentNode.querySelectorAll(IAEngine.ELEMENT_PROMPT);
        console.log(`    Listing ALL <${IAEngine.ELEMENT_PROMPT}> children...`);
        promptList.forEach(prompt => {
            prompt = IAEngine.verifyPrompt(prompt, this.script);
            if (IAEngine.evaluateXML(prompt, this.script, this.variables)) this.promptArray.push(prompt);
        });
        console.log(`    Listing TRUE <${IAEngine.ELEMENT_PROMPT}> children...`);
        const l = this.promptArray.length;
        for (let i=0; i<l; i++) {
            prompt = this.promptArray[i];
            console.log(`    ${prompt.outerHTML}`);
        }
        this.parseModifyArray(this.promptArray);
        this.dispatchEventWith(this.#PARSE_PROMPT);
    }
    parseModifyArray(xmlArray) {
        const sceneID = this.currentScene.getAttribute(IAEngine.ATTRIBUTE_ID);
        const nodeID = this.currentNode.getAttribute(IAEngine.ATTRIBUTE_ID);
        this.variables.incVar(`${sceneID}.${nodeID}`, 1);
        xmlArray.forEach(xml => {
            this.parseModifyList(xml);
        });
    }
    parseModifyList(xml) {
        const modifyVarList = xml.querySelectorAll(IAEngine.ELEMENT_MODIFYVAR);
        modifyVarList.forEach(modifyVar => {
            modifyVar = IAEngine.verifyModifyVar(modifyVar, this.script);
            const varID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_VAR_ID);
            const command = modifyVar.getAttribute(IAEngine.ATTRIBUTE_COMMAND);
            const value = parseFloat(modifyVar.getAttribute(IAEngine.ATTRIBUTE_VALUE));
            if (command === 'setVar') this.variables.setVar(varID, value);
            else if (command === 'incVar') this.variables.incVar(varID, value);
            else if (command === 'decVar') this.variables.decVar(varID, value);
        });
    }
    onParsePrompt() {
        this.removeEventListener(this.#PARSE_PROMPT, this.onParsePrompt);
        if (this.promptArray.length > 0) this.loadPromptAudio();
        else this.prepParseChoice()
    }
    loadPromptAudio() {
        const responseArray = [];
        const promiseArray = [];
        let fileCount = 0;
        let fileTotal = this.promptArray.length;
        const indent = '    ';
        for (const prompt of this.promptArray) {
            const file = prompt.getAttribute(IAEngine.ATTRIBUTE_FILE);
            const url = `../../projects/${this.projectName}/audio/${file}`;
            console.log(`${indent}Fetching file: ${url}`);
            const promise = fetch(url)
                .then(response => {
                    if (response.ok) {
                        responseArray.push(response);
                        return response.blob();
                    } else throw new Error(`${indent}Failed to fetch "${url}".`);
                })
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    const audio = new Audio();
                    audio.setAttribute(IAEngine.ATTRIBUTE_FILE, file);
                    audio.src = blobUrl;
                    audio.addEventListener('loadeddata', loadedAudio);
                    this.audioArray.push(audio);
                });
            promiseArray.push(promise);
        }
        Promise.all(promiseArray)
            .then(() => {
                for (const response of responseArray) {
                    const contentLength = Number(response.headers.get('Content-Length'));
                    this.downloadSize += contentLength;
                }
                console.log(`${indent}Total prompt file size: ${this.downloadSize} bytes`);
                
            })
            .catch(error => {
                console.error('Error:', error);
            });
        const loadedAudio = (evt) => {
            const audio = evt.target;
            audio.removeEventListener('loadeddata', loadedAudio);
            URL.revokeObjectURL(audio.src);
            console.log(`${indent}Fully downloaded "${audio.getAttribute(IAEngine.ATTRIBUTE_FILE)}".`);
            fileCount++;
            if (fileCount === fileTotal) {
                responseArray.length = promiseArray.length = 0;
                if (this.firstAudio) {
                    this.firstAudio = false;
                    this.player.playButton.enable();
                } else this.playPromptAudio();
            }
        }
    }
    playPromptAudio = () => {
        let currentIndex = 0;
        const playNextAudio = () => {
            if (currentIndex < this.audioArray.length) {
                const audio = this.audioArray[currentIndex];
                audio.addEventListener('ended', onAudioEnded);
                audio.play();
            } else dispatchAudioCompleteEvent();
        }
        const onAudioEnded = () => {
            const audio = this.audioArray[currentIndex];
            audio.removeEventListener('ended', onAudioEnded);
            currentIndex++;
            playNextAudio();
        }
        const dispatchAudioCompleteEvent = () => {
            
        }
        playNextAudio();
    }
    prepParseChoice() {
        this.addEventListener(this.#PARSE_CHOICE, this.onParseChoice);
        this.addEventListener(this.#PARSE_GOTO, this.onParseGoto);
        this.parseChoiceList();
    }
    parseChoiceList() {
        const choiceList = this.currentNode.querySelectorAll('choice');
        if (choiceList.length > 0) {
            choiceList.forEach(choice => {
                choice = IAEngine.verifyChoice(choice, this.script);
                if (IAEngine.evaluateXML(choice)) this.choiceArray.push(choice);
            });
            if (this.choiceArray.length > 0) {
                this.dispatchEventWith(this.#PARSE_CHOICE);
                return;
            }
        }
        this.parseGotoList(this.currentNode); // If there are no choices after a prompt, parse the node for goto.
    }
    onParseChoice() {
        this.removeEventListener(this.#PARSE_CHOICE,this.onParseChoice);
        console.log('onParseChoice');
        //initChoice();
        //showChoice();
    }
    parseGotoList(xml) {
        const gotoList = xml.querySelectorAll(IAEngine.ELEMENT_GOTO);
        const elementPrefix = `Element <${xml.tagName}> with ${IAEngine.ATTRIBUTE_ID}="${xml.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
        const indent = xml.tagName === IAEngine.ELEMENT_NODE ? '    ' : '        ';
        if (gotoList.length > 0) {
            console.log(`${indent}Listing ALL <${IAEngine.ELEMENT_GOTO}> children...`);
            const gotoArray = [];
            gotoList.forEach(goto => {
                gotoArray.push(IAEngine.verifyGoto(goto, indent, this.script));
            });
            const l = gotoArray.length;
            let firstTrueGoto;
            for (let i=0; i<l; i++) {
                const goto = gotoArray[i];
                if (IAEngine.evaluateXML(goto)) {
                    firstTrueGoto = goto;
                    break;
                }
            }
            gotoArray.length = 0;
            if (firstTrueGoto) {
                console.log(`${indent}Executing first TRUE <${IAEngine.ELEMENT_GOTO}>...\n${indent}${firstTrueGoto.outerHTML}`);
                this.parseGoto(firstTrueGoto);
            } else throw new Error(`${elementPrefix} has <${IAEngine.ELEMENT_GOTO}> children, but all of them are false.`);
        } else throw new Error(`${elementPrefix} has no <${IAEngine.ELEMENT_GOTO}> children.`);
    }
    parseGoto(goto) {
        const sceneID = goto.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
        if (sceneID) {
            this.nextSceneName = sceneID;
            if (goto.getAttribute('gameOver') === 'true') this.initVars();
        }
        const nodeID = goto.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
        if (nodeID) this.nextNodeName = nodeID;
        this.dispatchEventWith(this.#PARSE_GOTO);
    }
    onParseGoto() {
        this.removeEventListener(this.#PARSE_GOTO,this.onParseGoto);
        this.removeEventListener(this.#PARSE_CHOICE,this.onParseChoice);
        //player.disableProgress();
        //player.replay.disable();
        //cleanPrompt();
        this.gotoNext();
    }
}

class Variables {
    constructor() {
        this.object = {};
    }
    getVar(property) {
        return this.getObjectProperty(property);
    }
    setVar(property, value) {
        this.setObjectProperty(property, value);
    }

    incVar(property, amount = 1) {
        this.incrementObjectProperty(property, amount);
    }

    decVar(property, amount = 1) {
        this.decrementObjectProperty(property, amount);
    }
    reset() {
        this.object = {};
    }
    getObjectProperty(property) {
        return this.object.hasOwnProperty(property) ? this.object[property] : 0;
    }
    setObjectProperty(property, value) {
        this.object[property] = value;
    }
    incrementObjectProperty(property, amount = 1) {
        if (this.object.hasOwnProperty(property)) {
            const currentValue = this.object[property];
            this.object[property] = currentValue + amount;
        } else this.setObjectProperty(property, amount);
    }
    decrementObjectProperty(property, amount = 1) {
        this.incrementObjectProperty(property, -amount);
    }
}