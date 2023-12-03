import { UIElement } from '../../frameworks/UserInterface_JS/UIElement.js';
import { AssetLoader } from '../../frameworks/Utilities_JS/AssetLoader.js';
import { AudioManager } from '../../frameworks/Utilities_JS/AudioManager.js';
import { Variables } from '../../frameworks/Utilities_JS/Variables.js';
import { COMPLETE } from '../../frameworks/Utilities_JS/constants.js';
import { IAPlayer } from './IAPlayer.js';
import { IABranches } from './IABranches.js';

export class IAEngine extends UIElement {
    static COMPLETE_LOAD_SCRIPT = 'completeLoadScript';
    //#GOTO_SCENE = 'gotoScene';
    static COMPLETE_PARSE_PROMPT = 'completeParsePrompt';
    static COMPLETE_PLAY_PROMPT = 'completePlayPrompt';
    static COMPLETE_PARSE_CHOICE = 'completeParseChoice';
    static COMPLETE_MADE_CHOICE = 'completeMadeChoice';
    static COMPLETE_PARSE_GOTO = 'completeParseGoto';
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
    static INDENT_ONE = '    ';
    static INDENT_TWO = `${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}`;
    static INDENT_THREE = `${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}`;
    static INDENT_FOUR = `${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}${IAEngine.INDENT_ONE}`;
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
    static abridgeElement(element, includeTextContent=false, indent='') {
        const tagName = element.tagName;
        const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
        const space = attributes === '' ? '' : ' ';
        const textContent = includeTextContent ? ` ${element.textContent.trim()}` : '';
        return `${indent}<${tagName}${space}${attributes}>${textContent}`;
    }
    static logElement(element, includeTextContent=false, indent='') {
        console.log(IAEngine.abridgeElement(element, includeTextContent, indent));
    }
    static verifyPrompt(prompt, script) {
        if (prompt.hasAttribute(IAEngine.ATTRIBUTE_FILE)) {
            IAEngine.logElement(prompt, false, IAEngine.INDENT_TWO);
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
    static verifyCondition(condition, indent, script) { // Verify the condition, which may have a parent that is a prompt, choice, or goto.
        if (condition.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) &&
            condition.hasAttribute(IAEngine.ATTRIBUTE_OPERATOR) &&
            condition.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) return condition;
        else {
            const conditionID = condition.getAttribute(IAEngine.ATTRIBUTE_CONDITION_ID);
            const nodeID = condition.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = condition.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const conditionPrefix = `Condition "${condition.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (conditionID && nodeID && sceneID) {
                console.log(`${indent}Attempting to reference another <${IAEngine.ELEMENT_CONDITION}> with ${IAEngine.ATTRIBUTE_CONDITION_ID}="${conditionID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
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
                return this.verifyCondition(condition, indent, script);
            } else throw new Error(`${conditionPrefix} does not have "${IAEngine.ATTRIBUTE_VAR_ID}", "${IAEngine.ATTRIBUTE_OPERATOR}" and "${IAEngine.ATTRIBUTE_VALUE}" attributes nor does it have "${IAEngine.ATTRIBUTE_CONDITION_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyModifyVar(modifyVar, script) {
        if (modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_COMMAND) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) {
            //console.log(`Verified: ${modifyVar.outerHTML}`);
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
            this.logElement(choice, true, IAEngine.INDENT_TWO);
            return choice;
        } else {
            const choiceID = choice.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
            const nodeID = choice.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = choice.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const choicePrefix = `Choice "${choice.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (choiceID && nodeID && sceneID) {
                console.log(`${IAEngine.INDENT_TWO}Attempting to reference another <${IAEngine.ELEMENT_CHOICE}> with ${IAEngine.ATTRIBUTE_CHOICE_ID}="${choiceID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
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
            this.logElement(goto, true, indent);
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
    static evaluateXML(xml, indent, script, variables) {
        const conditionArray = Array.from(xml.children).filter(child => {return child.tagName === IAEngine.ELEMENT_CONDITION;});
        const l = conditionArray.length;
        for (let i=0; i<l; i++) {
            let condition = conditionArray[i];
            condition = IAEngine.verifyCondition(condition, indent, script);
            const varID = condition.getAttribute(IAEngine.ATTRIBUTE_VAR_ID);
            const operator = condition.getAttribute(IAEngine.ATTRIBUTE_OPERATOR);
            const value = parseFloat(condition.getAttribute(IAEngine.ATTRIBUTE_VALUE));
            if (!IAEngine.evaluate(variables, varID, operator, value, indent)) {
                console.log(`${indent}${condition.outerHTML} - FALSE`);
                return false;
            } else console.log(`${indent}${condition.outerHTML} - TRUE`);
        }
        return true;
    }
    static evaluate(variables, varID, operator, value, indent) {
        const testValue = variables.getVar(varID);
        let result;
        switch (operator) {
            case '==':
                result = testValue === value;
                break;
            case '!=':
                result = testValue !== value;
                break;
            case '<':
                result = testValue < value;
                break;
            case '<=':
                result = testValue <= value;
                break;
            case '>':
                result = testValue > value;
                break;
            case '>=':
                result = testValue >= value;
                break;
            case '=':
                throw new Error(`Operator "=" is invalid. Did you mean "==" instead?`);
            default:
                throw new Error(`Operator "${operator}" is invalid.`);
        }
        console.log(`${indent}Variable "${varID}" has a current value of "${testValue}".`);
        return result;
    }

    constructor(projectName) {
        super();
        this.projectName = projectName;
        this.player = new IAPlayer();
        this.player.replayFunction = this.pressReplay;
        this.player.pauseFunction = this.pressPause;
        this.player.playFunction = this.pressPlay;
        this.player.skipFunction = this.pressSkip;
        this.appendChild(this.player);
        this.branches = new IABranches({width:IAPlayer.PLAYER_WIDTH, top:IAPlayer.PLAYER_HEIGHT+10});
        this.appendChild(this.branches);
        this.assetLoader = new AssetLoader({
            requestLogFunction: this.requestLog,
            progressFunction: this.requestProgress
        });
        this.script = null;
        this.variables = new Variables();
        this.nextSceneName = null;
        this.nextNodeName = null;
        this.currentScene = null;
        this.currentNode = null;
        this.promptArray = [];
        this.voArray = [];
        this.voCurrent;
        this.choiceArray = [];
        this.promptIndex;
        this.cumulativeTime;
        this.totalTime;
        this.firstAudio = true;
    }
    pressReplay = () => {
        this.player.notReadyState();
        const vo = this.voCurrent;
        this.removeEndListenerFromVo(vo);
        AudioManager.fadeOut(vo, 200, () => {
            this.removeUpdateListenerFromVo(vo);
            vo.currentTime = 0;
            this.promptIndex = 0;
            this.cumulativeTime = 0;
            this.player.setProgressToZero();
            this.playPromptVo();
        });
    }
    pressPause = () => {
        const vo = this.voCurrent;
        if (vo) {
            this.player.pauseState();
            vo.pause();
        }
    }
    pressPlay = () => {
        const voCurrent = this.voCurrent;
        if (voCurrent && voCurrent.paused) voCurrent.play();
        else this.playPromptVo();
    }
    pressSkip = () => {
        this.player.notReadyState();
        const vo = this.voCurrent;
        this.removeEndListenerFromVo(vo);
        AudioManager.fadeOut(vo, 200, () => {
            this.removeUpdateListenerFromVo(vo);
            vo.currentTime = 0;
            this.player.doneState();
            this.player.setProgressToTotal();
            this.dispatchEventWith(IAEngine.COMPLETE_PLAY_PROMPT);
        });
    }
    exec() {
        this.addEventListener(IAEngine.COMPLETE_LOAD_SCRIPT, this.onLoadScript);
        this.loadScript('script.iae')
            .then((xmlData) => {
                this.script = xmlData;
                this.dispatchEventWith(IAEngine.COMPLETE_LOAD_SCRIPT);
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
        this.removeEventListener(IAEngine.COMPLETE_LOAD_SCRIPT,this.onLoadScript);
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
            this.addEventListener(this.END_SCENE, this.gotoScene);
            this.dispatchEventWith(this.END_SCENE);
        } else this.gotoNode();
    }
    gotoScene() {
        this.removeEventListener(this.END_SCENE,this.gotoScene);
        this.currentScene = IAEngine.getScene(this.nextSceneName, this.script);
        this.player.setSceneText(this.getSceneText(this.currentScene));
        IAEngine.logElement(this.currentScene, false);
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
        this.voCurrent = null;
        this.promptIndex = 0;
        this.disposeAudio();
        this.cumulativeTime = 0;
        this.totalTime = 0;
        this.player.setLoadProgress(0);
        this.player.setPlayProgress(0);
        IAEngine.logElement(this.currentNode, false, IAEngine.INDENT_ONE);
        this.prepParsePrompt();
    }
    disposeAudio() {
        this.voArray.forEach(audio => {
            URL.revokeObjectURL(audio.src);
            audio.src = '';
        });
        this.voArray.length = 0;
    }
    prepParsePrompt() {
        this.addEventListener(IAEngine.COMPLETE_PARSE_PROMPT, this.onParsePrompt);
        this.parsePromptList();
    }
    parsePromptList() {
        const promptList = this.currentNode.querySelectorAll(IAEngine.ELEMENT_PROMPT);
        if (promptList.length > 0) {
            console.log(`${IAEngine.INDENT_ONE}Listing ALL <${IAEngine.ELEMENT_PROMPT}> children...`);
            promptList.forEach(prompt => {
                prompt = IAEngine.verifyPrompt(prompt, this.script);
                if (IAEngine.evaluateXML(prompt, IAEngine.INDENT_THREE, this.script, this.variables)) this.promptArray.push(prompt);
            });
            const l = this.promptArray.length;
            if (l > 0 ) {
                console.log(`${IAEngine.INDENT_ONE}Listing TRUE <${IAEngine.ELEMENT_PROMPT}> children...`);
                for (let i=0; i<l; i++) {
                    prompt = this.promptArray[i];
                    IAEngine.logElement(prompt, true, IAEngine.INDENT_TWO);
                }
                this.parseModifyArray(this.promptArray);
            } else console.log(`${IAEngine.INDENT_ONE}All <${IAEngine.ELEMENT_PROMPT}> children are false!`);
        } else console.log(`${IAEngine.INDENT_ONE}No <${IAEngine.ELEMENT_PROMPT}> children exist.`);
        this.dispatchEventWith(IAEngine.COMPLETE_PARSE_PROMPT);
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
            console.log(`${IAEngine.INDENT_THREE}Variable "${varID}" set to "${this.variables.getVar(varID)}".`);
        });
    }
    onParsePrompt() {
        this.removeEventListener(IAEngine.COMPLETE_PARSE_PROMPT, this.onParsePrompt);
        if (this.promptArray.length > 0) this.loadPromptAudio();
        else this.prepParseChoice()
    }
    loadPromptAudio() {
        const fileArray = this.promptArray.map(prompt => {return prompt.getAttribute(IAEngine.ATTRIBUTE_FILE);});
        const urlArray = fileArray.map(file => {return `./audio/${file}`});
        this.assetLoader.errorFunction = requestError;
        this.assetLoader.completeLogFunction = completeLog;
        this.assetLoader.addEventListener(COMPLETE, this.processBlobs);
        this.assetLoader.loadArray(urlArray);
        function requestError(i) {
            throw new Error(`${IAEngine.INDENT_ONE}Failed to download "${urlArray[i]}".`);
        }
        function completeLog(i) {
            console.log(`${IAEngine.INDENT_ONE}Downloaded file: "${urlArray[i]}".`);
        }
    }
    processBlobs = () => {
        this.assetLoader.removeEventListener(COMPLETE, this.processBlobs);
        const LOADED_METADATA = 'loadedmetadata';
        const l = this.assetLoader.blobArray.length;
        let durationCount = 0;
        const addDuration = (evt) => {
            const audio = evt.target;
            audio.removeEventListener(LOADED_METADATA, addDuration);
            this.totalTime += audio.duration;
            durationCount++;
            if (durationCount === l) {
                this.player.setProgressTime(0);
                this.player.setTotalTime(this.totalTime);
            }
        }
        for (let i=0; i<l; i++) {
            const blob = this.assetLoader.blobArray[i];
            const blobUrl = URL.createObjectURL(blob);
            const audio = this.voArray[i] = new Audio();
            audio.setAttribute(IAEngine.ATTRIBUTE_FILE, this.promptArray[i].getAttribute(IAEngine.ATTRIBUTE_FILE));
            audio.addEventListener(LOADED_METADATA, addDuration);
            audio.src = blobUrl;
        }
        this.assetLoader.dispose();
        this.addEventListener(IAEngine.COMPLETE_PLAY_PROMPT, this.prepParseChoice);
        if (this.firstAudio) {
            this.firstAudio = false;
            this.player.firstReadyState();
        } else this.playPromptVo();
    }
    requestLog(url) {
        console.log(`${IAEngine.INDENT_ONE}Requesting file: ${url}`);
    }
    requestProgress = (percent) => {
        this.player.setLoadProgress(percent);
    }
    playPromptVo = () => {
        if (this.promptIndex < this.voArray.length) {
            this.player.playState();
            const vo = this.voCurrent = this.voArray[this.promptIndex];
            vo.addEventListener('timeupdate', this.updateVo);
            vo.addEventListener('ended', this.endedVo);
            console.log(`${IAEngine.INDENT_ONE}Playing VO "${vo.getAttribute(IAEngine.ATTRIBUTE_FILE)}".`);
            vo.play();
        } else {
            this.player.doneState();
            this.dispatchEventWith(IAEngine.COMPLETE_PLAY_PROMPT);
        }
    }
    updateVo = (evt) => {
        const progressTime = this.cumulativeTime + evt.target.currentTime;
        this.player.setPlayProgress(progressTime / this.totalTime * 100);
        this.player.setProgressTime(progressTime);
    }
    endedVo = (evt) => {
        const vo = evt.target;
        this.removeUpdateListenerFromVo(vo);
        this.removeEndListenerFromVo(vo);
        vo.currentTime = 0;
        this.cumulativeTime += vo.duration;
        this.promptIndex++;
        this.playPromptVo();
    }
    removeUpdateListenerFromVo(vo) {
        vo.removeEventListener('timeupdate', this.updateVo);
    }
    removeEndListenerFromVo(vo) {
        vo.removeEventListener('ended', this.endedVo);
    }
    prepParseChoice() {
        this.removeEventListener(IAEngine.COMPLETE_PLAY_PROMPT, this.prepParseChoice);
        this.addEventListener(IAEngine.COMPLETE_PARSE_CHOICE, this.onParseChoice);
        this.addEventListener(IAEngine.COMPLETE_PARSE_GOTO, this.onParseGoto);
        this.parseChoiceList();
    }
    parseChoiceList() {
        const choiceList = this.currentNode.querySelectorAll('choice');
        if (choiceList.length > 0) {
            console.log(`${IAEngine.INDENT_ONE}Listing ALL <${IAEngine.ELEMENT_CHOICE}> children...`);
            choiceList.forEach(choice => {
                choice = IAEngine.verifyChoice(choice, this.script);
                if (IAEngine.evaluateXML(choice, IAEngine.INDENT_THREE, this.script, this.variables)) this.choiceArray.push(choice);
            });
            const l = this.choiceArray.length;
            if (l > 0) {
                console.log(`${IAEngine.INDENT_ONE}Listing TRUE <${IAEngine.ELEMENT_CHOICE}> children...`);
                for (let i=0; i<l; i++) {
                    const choice = this.choiceArray[i];
                    IAEngine.logElement(choice, true, IAEngine.INDENT_TWO);
                }
                this.dispatchEventWith(IAEngine.COMPLETE_PARSE_CHOICE);
                return;
            } else console.log(`${IAEngine.INDENT_ONE}All <${IAEngine.ELEMENT_CHOICE}> children are false!`);
        } else console.log(`${IAEngine.INDENT_ONE}No <${IAEngine.ELEMENT_CHOICE}> children exist.`);
        this.parseGotoList(this.currentNode); // If there are no choices after a prompt, parse the node for goto.
    }
    onParseChoice() {
        this.removeEventListener(IAEngine.COMPLETE_PARSE_CHOICE,this.onParseChoice);
        this.branches.addEventListener(IAEngine.COMPLETE_MADE_CHOICE, this.parseChosen);
        this.branches.displayChoices(this.choiceArray);
    }
    parseChosen = (evt) => {
        const choice = evt.detail;
        console.log(`${IAEngine.INDENT_ONE}Selected ${IAEngine.abridgeElement(choice, true)}...`);
        this.parseGotoList(choice);
    }
    parseGotoList(xml) {
        const gotoList = xml.querySelectorAll(IAEngine.ELEMENT_GOTO);
        const elementPrefix = `Element <${xml.tagName}> with ${IAEngine.ATTRIBUTE_ID}="${xml.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
        const headerIndent = xml.tagName === IAEngine.ELEMENT_NODE ? IAEngine.INDENT_ONE : IAEngine.INDENT_TWO;
        const gotoIndent = headerIndent + IAEngine.INDENT_ONE;
        if (gotoList.length > 0) {
            console.log(`${headerIndent}Listing ALL <${IAEngine.ELEMENT_GOTO}> children...`);
            const trueArray = [];
            gotoList.forEach(goto => {
                goto = IAEngine.verifyGoto(goto, gotoIndent, this.script);
                if (IAEngine.evaluateXML(goto, gotoIndent + IAEngine.INDENT_ONE, this.script, this.variables)) trueArray.push(goto);
            });
            const l = trueArray.length;
            if (l > 0) {
                const firstTrueGoto = trueArray[0];
                trueArray.length = 0;
                console.log(`${headerIndent}Executing first TRUE <${IAEngine.ELEMENT_GOTO}>...`);
                IAEngine.logElement(firstTrueGoto, true, gotoIndent);
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
        this.dispatchEventWith(IAEngine.COMPLETE_PARSE_GOTO);
    }
    onParseGoto() {
        this.removeEventListener(IAEngine.COMPLETE_PARSE_GOTO,this.onParseGoto);
        this.removeEventListener(IAEngine.COMPLETE_PARSE_CHOICE,this.onParseChoice);
        //player.disableProgress();
        //player.replay.disable();
        //cleanPrompt();
        this.gotoNext();
    }
}