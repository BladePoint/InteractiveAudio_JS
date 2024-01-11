import { UIButton } from '../UserInterface_JS/UIButton.js';
import { UIElement } from '../UserInterface_JS/UIElement.js';
import { TransitionRect } from '../UserInterface_JS/iPlayer.js';
import { AssetLoader } from '../Utilities_JS/AssetLoader.js';
import { AudioManager } from '../Utilities_JS/AudioManager.js';
import { Variables } from '../Utilities_JS/Variables.js';
import { COMPLETE, BLOCK, NONE } from '../Utilities_JS/constants.js';
import { loadLocalStorage, saveLocalStorage } from '../Utilities_JS/genUtils.js';
import { IAPlayer } from './IAPlayer.js';
import { IABranches } from './IABranches.js';
import { Main } from './Main.js';

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
    static LOCAL_STORAGE_KEY = 'InteractiveAudioEngine';
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
    static logElement(element, includeTextContent=false, indent='', appendage='') {
        console.log(IAEngine.abridgeElement(element, includeTextContent, indent) + appendage);
    }
    static verifyPrompt(prompt, indent, script) {
        if (prompt.hasAttribute(IAEngine.ATTRIBUTE_FILE)) {
            IAEngine.logElement(prompt, false, indent);
            return prompt;
        } else {
            const promptID = prompt.getAttribute(IAEngine.ATTRIBUTE_PROMPT_ID);
            const nodeID = prompt.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = prompt.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const promptPrefix = `Prompt "${prompt.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (promptID && nodeID && sceneID) {
                console.log(`${indent}Referencing another <${IAEngine.ELEMENT_PROMPT}> with ${IAEngine.ATTRIBUTE_PROMPT_ID}="${promptID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                prompt = IAEngine.getChildElement(promptID, IAEngine.ELEMENT_PROMPT, node);
                return this.verifyPrompt(prompt, indent, script);
            } else throw new Error(`${promptPrefix} does not have a "${IAEngine.ATTRIBUTE_FILE}" attribute nor does it have "${IAEngine.ATTRIBUTE_PROMPT_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyCondition(condition, indent, script) {//Verify the condition, which may have a parent that is a prompt, choice, or goto.
        if (condition.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) &&
            condition.hasAttribute(IAEngine.ATTRIBUTE_OPERATOR) &&
            condition.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) return condition;//Logging is done elsewhere, so TRUE or FALSE may be added
        else {
            const conditionID = condition.getAttribute(IAEngine.ATTRIBUTE_CONDITION_ID);
            const nodeID = condition.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = condition.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const conditionPrefix = `Condition "${condition.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (conditionID && nodeID && sceneID) {
                console.log(`${indent}Referencing another <${IAEngine.ELEMENT_CONDITION}> with ${IAEngine.ATTRIBUTE_CONDITION_ID}="${conditionID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
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
                    } else throw new Error(`${conditionPrefix}'s reference is invalid because it does not have "${IAEngine.ATTRIBUTE_PROMPT_ID}", "${IAEngine.ATTRIBUTE_CHOICE_ID}", or "${IAEngine.ATTRIBUTE_GOTO_ID}" attributes.`);
                }
                let grandparentXML = IAEngine.getNodeFromString(nodeID, sceneID, script);
                if (grandParentID && grandParentType) grandparentXML = IAEngine.getChildElement(grandParentID, grandParentType, grandparentXML);
                const parentXML = IAEngine.getChildElement(parentID, parentType, grandparentXML);
                condition = IAEngine.getChildElement(conditionID, IAEngine.ELEMENT_CONDITION, parentXML);
                return this.verifyCondition(condition, indent, script);
            } else throw new Error(`${conditionPrefix} does not have "${IAEngine.ATTRIBUTE_VAR_ID}", "${IAEngine.ATTRIBUTE_OPERATOR}" and "${IAEngine.ATTRIBUTE_VALUE}" attributes nor does it have "${IAEngine.ATTRIBUTE_CONDITION_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyModifyVar(modifyVar, indent, script) {
        if (modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VAR_ID) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_COMMAND) && modifyVar.hasAttribute(IAEngine.ATTRIBUTE_VALUE)) {
            IAEngine.logElement(modifyVar, false, indent);
            return modifyVar;
        } else {
            const modifyVarID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_MODIFYVAR_ID);
            const nodeID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
            const sceneID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
            const modifyVarPrefix = `ModifyVar "${modifyVar.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (modifyVarID && nodeID && sceneID) {
                console.log(`${indent}Referencing another <${IAEngine.ELEMENT_MODIFYVAR}> with ${IAEngine.ATTRIBUTE_MODIFYVAR_ID}="${modifyVarID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                let parentID;
                let parentType;
                const promptID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_PROMPT_ID);
                if (promptID) {
                    parentID = promptID;
                    parentType = IAEngine.ELEMENT_PROMPT;
                } else {
                    const choiceID = modifyVar.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
                    if (choiceID) {
                        parentID = choiceID;
                        parentType = IAEngine.ELEMENT_CHOICE;
                    } else throw new Error(`${modifyVarPrefix}'s reference was invalid because it does not have a "${IAEngine.ATTRIBUTE_PROMPT_ID}" or "${IAEngine.ATTRIBUTE_CHOICE_ID}" attribute.`);
                }
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                const parentXML = IAEngine.getChildElement(parentID, parentType, node);
                modifyVar = IAEngine.getChildElement(modifyVarID, IAEngine.ELEMENT_MODIFYVAR, parentXML);
                return this.verifyModifyVar(modifyVar, indent, script);
            } else throw new Error(`${modifyVarPrefix} does not have "${IAEngine.ATTRIBUTE_VAR_ID}", "${IAEngine.ATTRIBUTE_COMMAND}", and "${IAEngine.ATTRIBUTE_VALUE}" attributes nor does it have "${IAEngine.ATTRIBUTE_MODIFYVAR_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
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
                console.log(`${IAEngine.INDENT_TWO}Referencing another <${IAEngine.ELEMENT_CHOICE}> with ${IAEngine.ATTRIBUTE_CHOICE_ID}="${choiceID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                const node = IAEngine.getNodeFromString(nodeID, sceneID, script);
                choice = IAEngine.getChildElement(choiceID, IAEngine.ELEMENT_CHOICE, node);
                return this.verifyChoice(choice, script);
            } else throw new Error(`${choicePrefix} does not have any <${IAEngine.ELEMENT_GOTO}> children nor does it have "${IAEngine.ATTRIBUTE_CHOICE_ID}", "${IAEngine.ATTRIBUTE_NODE_ID}", and "${IAEngine.ATTRIBUTE_SCENE_ID}" reference attributes.`);
        }
    }
    static verifyGoto(goto, indent, script) { // Verify the goto, which may have a parent that is a node or a choice
        const gotoID = goto.getAttribute(IAEngine.ATTRIBUTE_GOTO_ID);
        const nodeID = goto.getAttribute(IAEngine.ATTRIBUTE_NODE_ID);
        const sceneID = goto.getAttribute(IAEngine.ATTRIBUTE_SCENE_ID);
        if (!gotoID && (nodeID || sceneID)) {//If there is no gotoID, nodeID and sceneID are telling where to go
            this.logElement(goto, true, indent);
            return goto;
        } else {//If there is a gotoID, nodeID and sceneID tell the parent of the referenced goto
            const gotoPrefix = `Goto "${goto.getAttribute(IAEngine.ATTRIBUTE_ID)}"`;
            if (gotoID) {
                if (nodeID && sceneID) {
                    console.log(`${indent}Referencing another <${IAEngine.ELEMENT_GOTO}> with ${IAEngine.ATTRIBUTE_GOTO_ID}="${gotoID}", ${IAEngine.ATTRIBUTE_NODE_ID}="${nodeID}", and ${IAEngine.ATTRIBUTE_SCENE_ID}="${sceneID}"...`);
                    let referenceParent = IAEngine.getNodeFromString(nodeID, sceneID, script);
                    const choiceID = goto.getAttribute(IAEngine.ATTRIBUTE_CHOICE_ID);
                    if (choiceID) referenceParent = IAEngine.getChildElement(choiceID, IAEngine.ELEMENT_CHOICE, referenceParent);
                    goto = IAEngine.getChildElement(gotoID, IAEngine.ELEMENT_GOTO, referenceParent);
                    return this.verifyGoto(goto, indent, script);
                } else throw new Error(`${gotoPrefix}'s reference is invalid because it does not have a "${IAEngine.ATTRIBUTE_NODE_ID}" and "${IAEngine.ATTRIBUTE_SCENE_ID}".`);
            } else throw new Error(`${gotoPrefix} does not have a "${IAEngine.ATTRIBUTE_NODE_ID}" or "${IAEngine.ATTRIBUTE_SCENE_ID}", nor does it have a "${IAEngine.ATTRIBUTE_GOTO_ID}" reference attribute.`);
        }
    }
    static evaluateXML(xml, indent, script, variables) {
        const conditionArray = Array.from(xml.children).filter(child => {return child.tagName === IAEngine.ELEMENT_CONDITION;});
        for (let condition of conditionArray) {
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
    static transitionRect = null;
    static popup(button, menu) {
        const overlayDiv = Main.overlayDiv;
        overlayDiv.style.display = BLOCK;
        overlayDiv.style.opacity = 0;
        const popupDiv = Main.popupDiv;
        popupDiv.style.display = BLOCK;
        if (IAEngine.transitionRect === null) IAEngine.transitionRect = new TransitionRect({});
        const transitionRect = IAEngine.transitionRect;
        transitionRect.assignStyles({transform:Main.transform});
        transitionRect.appendToParent(popupDiv);
        const onIn = () => {
            transitionRect.style.display = NONE;
            menu.init();
            menu.appendToParent(popupDiv);
            overlayDiv.style.opacity = .5;
            overlayDiv.addEventListener(UIButton.POINTER_DOWN, overlayCallback);
        }
        const overlayCallback = () => {
            overlayDiv.removeEventListener(UIButton.POINTER_DOWN, overlayCallback);
            overlayDiv.style.opacity = 0;
            menu.removeFromParent(popupDiv);
            menu.fini();
            transitionRect.style.display = BLOCK;
            transitionRect.transitionTo({
                startObject: menu,
                endObject: button,
                onUpdate: progress => {overlayDiv.style.opacity = .5 - progress/2;},
                onComplete: onOut
            });
        }
        const onOut = () => {
            overlayDiv.style.display = NONE;
            transitionRect.removeFromParent(popupDiv);
        }
        transitionRect.transitionTo({
            startObject: button,
            endObject: menu,
            onUpdate: progress => {overlayDiv.style.opacity = progress/2;},
            onComplete: onIn
        });
    }

    constructor(projectName) {
        super();
        this.projectName = projectName;
        this.player = new IAPlayer({
            getMasterVolume:this.getMasterVolume, setMasterVolume:this.setMasterVolume,
            getVoVolume:this.getVoVolume, setVoVolume:this.setVoVolume,
            getBgmVolume:this.getBgmVolume, setBgmVolume:this.setBgmVolume,
            saveSettings: () => {saveLocalStorage(IAEngine.LOCAL_STORAGE_KEY, this.settings)},
            replayCallback:this.replayCallback, pauseCallback:this.pauseCallback, playCallback:this.playCallback, skipCallback:this.skipCallback, seekCallback:this.seekCallback
        });
        this.appendChild(this.player);
        this.branches = new IABranches({width:IAPlayer.PLAYER_WIDTH, top:IAPlayer.PLAYER_HEIGHT+11, onSelect:this.skipCallback});
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
        this.audioManager = new AudioManager();
        this.audioManager.addTrack(AudioManager.VO);
        this.settings = loadLocalStorage(IAEngine.LOCAL_STORAGE_KEY, {masterVolume:1, voVolume:1, bgmVolume:1});
        this.setMasterVolume(this.settings.masterVolume);
        this.setVoVolume(this.settings.voVolume);
        this.setBgmVolume(this.settings.bgmVolume);
    }
    getMasterVolume = () =>{return this.settings.masterVolume;}
    setMasterVolume = (decimal) =>{
        this.settings.masterVolume = decimal;
        this.audioManager.settingVolume = decimal;
    }
    getVoVolume = () =>{return this.settings.voVolume;}
    setVoVolume = (decimal) =>{
        this.settings.voVolume = decimal;
        //this.audioManager.setTrackVolume(AudioManager.VO, decimal);
    }
    getBgmVolume = () =>{return this.settings.bgmVolume;}
    setBgmVolume = (decimal) =>{
        this.settings.bgmVolume = decimal;
        //this.audioManager.setTrackVolume(AudioManager.BGM, decimal);
    }
    replayCallback = () => {
        const vo = this.voCurrent;
        const cleanVo = () => {
            vo.removeUpdateListener();
            vo.currentTime = 0;
        }
        const replay = () => {
            this.promptIndex = 0;
            this.cumulativeTime = 0;
            this.player.setPlayProgressToZero();
            this.playPromptVo();
        }
        if (vo) {
            vo.removeEndListener();
            if (vo.paused) {
                cleanVo();
                replay();
            } else {
                this.player.notReadyState();
                AudioManager.fadeOutAudio(vo, 200, () => {
                    cleanVo();
                    replay();
                });
            }
        } else replay();
    }
    pauseCallback = () => {
        this.player.pauseState();
        this.voCurrent.pause();
    }
    playCallback = () => {
        const vo = this.voCurrent;
        if (vo) {
            this.player.playState();
            vo.play();
        } else this.playPromptVo();
    }
    skipCallback = (evt) => {
        const vo = this.voCurrent;
        const skip = () => {
            vo.removeUpdateListener();
            vo.currentTime = 0;
            this.voCurrent = null;
            if (evt) this.player.doneState();//evt exists if skipCallback was called by the skip button. If not, it was called by IABranches
            this.player.setPlayProgressToTotal();
            this.dispatchEventWith(IAEngine.COMPLETE_PLAY_PROMPT);
        }
        this.player.notReadyState();
        if (vo) {
            vo.removeEndListener();
            if (vo.paused) skip();
            else AudioManager.fadeOutAudio(vo, 200, skip);
        }
    }
    seekCallback = (decimal) => {
        const seekTime = decimal * this.totalTime;
        const l = this.voArray.length;
        let cumulativeDuration = 0;
        let seekIndex = 0;
        let voTime = seekTime;
        if (l > 1) {
            for (; seekIndex<l; seekIndex++) {
                const vo = this.voArray[seekIndex];
                const currentDuration = cumulativeDuration + vo.duration;
                if (seekTime < currentDuration) {
                    voTime = seekTime - cumulativeDuration;
                    break;
                } else cumulativeDuration = currentDuration;
            }
        }
        const voSeek = this.voArray[seekIndex];
        const voCurrent = this.voCurrent;
        if (voCurrent) {
            voCurrent.removeUpdateListener();
            voCurrent.removeEndListener();
            if (voCurrent !== voSeek) {
                voCurrent.pause();
                voCurrent.currentTime = 0;
            }
        }
        this.promptIndex = seekIndex;
        this.cumulativeTime = cumulativeDuration;
        voSeek.currentTime = voTime;
        this.player.setPlayProgress(decimal);
        this.player.setProgressTime(seekTime);
        this.playPromptVo();
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
        this.player.setInfoText(this.script.querySelector('Info').textContent.trim());
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
        const sceneID = this.currentScene.getAttribute(IAEngine.ATTRIBUTE_ID);
        const nodeID = this.currentNode.getAttribute(IAEngine.ATTRIBUTE_ID);
        this.variables.incVar(`${sceneID}.${nodeID}`, 1);
        IAEngine.logElement(this.currentNode, false, IAEngine.INDENT_ONE, ` - visit #${this.variables.getVar(`${sceneID}.${nodeID}`)}`);
        this.promptArray.length = this.choiceArray.length = 0;
        this.voCurrent = null;
        this.promptIndex = 0;
        this.disposeAudio();
        this.cumulativeTime = 0;
        this.totalTime = 0;
        this.player.setLoadProgress(0);
        this.player.notReadyState();
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
                prompt = IAEngine.verifyPrompt(prompt, IAEngine.INDENT_TWO, this.script);
                if (IAEngine.evaluateXML(prompt, IAEngine.INDENT_THREE, this.script, this.variables)) this.promptArray.push(prompt);
            });
            if (this.promptArray.length > 0 ) {
                console.log(`${IAEngine.INDENT_ONE}Listing TRUE <${IAEngine.ELEMENT_PROMPT}> children...`);
                this.promptArray.forEach(prompt => {
                    IAEngine.logElement(prompt, true, IAEngine.INDENT_TWO);
                    this.parseModifyList(prompt, IAEngine.INDENT_THREE);
                });
            } else console.log(`${IAEngine.INDENT_ONE}All <${IAEngine.ELEMENT_PROMPT}> children are false!`);
        } else console.log(`${IAEngine.INDENT_ONE}No <${IAEngine.ELEMENT_PROMPT}> children exist.`);
        this.dispatchEventWith(IAEngine.COMPLETE_PARSE_PROMPT);
    }
    parseModifyList(xml, indent) {
        const modifyVarList = xml.querySelectorAll(IAEngine.ELEMENT_MODIFYVAR);
        modifyVarList.forEach(modifyVar => {
            modifyVar = IAEngine.verifyModifyVar(modifyVar, indent, this.script);
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
        this.player.setPlayProgress(0);
        this.assetLoader.removeEventListener(COMPLETE, this.processBlobs);
        const l = this.assetLoader.blobArray.length;
        let durationCount = 0;
        const addDuration = (audio) => {
            audio.removeMetadataListener();
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
            const audio = this.voArray[i] = this.audioManager.newAudio(this.promptArray[i].getAttribute(IAEngine.ATTRIBUTE_FILE), AudioManager.VO);
            audio.addMetadataListener(addDuration);
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
    requestProgress = (decimal) => {
        this.player.setLoadProgress(decimal);
    }
    playPromptVo = () => {
        if (this.promptIndex < this.voArray.length) {
            this.player.playState();
            const vo = this.voCurrent = this.voArray[this.promptIndex];
            vo.addUpdateListener(this.updateVo);
            vo.addEndListener(this.endedVo);
            console.log(`${IAEngine.INDENT_ONE}Playing VO "${vo.id}".`);
            vo.play();
        } else {
            this.player.doneState();
            this.dispatchEventWith(IAEngine.COMPLETE_PLAY_PROMPT);
        }
    }
    updateVo = (vo) => {
        const progressTime = this.cumulativeTime + vo.currentTime;
        this.player.setPlayProgress(progressTime / this.totalTime);
        this.player.setProgressTime(progressTime);
    }
    endedVo = (vo) => {
        vo.removeUpdateListener();
        vo.removeEndListener();
        vo.currentTime = 0;
        this.cumulativeTime += vo.duration;
        this.voCurrent = null;
        this.promptIndex++;
        this.playPromptVo();
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
            if (this.choiceArray.length > 0) {
                console.log(`${IAEngine.INDENT_ONE}Listing TRUE <${IAEngine.ELEMENT_CHOICE}> children...`);
                this.choiceArray.forEach(choice => {IAEngine.logElement(choice, true, IAEngine.INDENT_TWO);});
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