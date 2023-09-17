import { UIElement } from '../../frameworks/UserInterface_JS/UIElement.js';
import { IAPlayer } from './IAPlayer.js';

export class IAEngine extends UIElement {
    LOAD_SCRIPT = 'loadScript';
    GOTO_SCENE = 'gotoScene';
    PARSE_PROMPT = 'parsePrompt';
    ELEMENT_PROMPT = 'prompt';
    constructor() {
        super();
        this.player = new IAPlayer();
        this.appendChild(this.player);
        this.script = null;
        this.variables = new Variables();
        this.nextSceneName = null;
        this.nextNodeName = null;
        this.currentScene = null;
        this.currentNode = null;
        this.promptsArray = [];
        this.choicesArray = [];
    }
    exec() {
        this.addEventListener(this.LOAD_SCRIPT,this.onLoadScript);
        this.loadScript();
    }
    loadScript() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '../../../_resources/TestMansion/script.iae', true);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                const xmlText = xhr.responseText;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
                this.script = xmlDoc;
                this.dispatchEventWith(this.LOAD_SCRIPT);
            } else console.error('Error loading script.iae file.');
        };
        xhr.send();
    }
    onLoadScript() {
        this.removeEventListener(this.LOAD_SCRIPT,this.onLoadScript);
        this.player.setTitleText(this.script.querySelector('InteractiveAudioAdventure').getAttribute('title'));
        this.parseScript();
    }
    parseScript() {
        this.initVars();
        this.initScene();
    }
    initVars() {
        this.variables.reset();
        const variablesElement = this.script.querySelector('Variables');
        if (variablesElement) {
            const variableElements = variablesElement.querySelectorAll('variable');
            for (const variableElement of variableElements) {
                const id = variableElement.getAttribute('id');
                const value = parseFloat(variableElement.getAttribute('value'));
                this.variables.setVar(id, value);
            }
        }
    }
    initScene() {
        this.nextSceneName = "Title";
        this.gotoNext();
    }
    gotoNext() {
        if (!this.currentScene || this.currentScene.getAttribute('id') !== nextSceneName) {
            this.addEventListener(this.END_SCENE,this.gotoScene);
            this.dispatchEventWith(this.END_SCENE);
        } else this.gotoNode();
    }
    gotoScene() {
        this.removeEventListener(this.END_SCENE,this.gotoScene);
        this.currentScene = this.getSceneByID(this.nextSceneName);
        this.player.setSceneText(this.currentScene.textContent.trim());
        this.gotoNode();
    }
    getSceneByID(id) {
        const sceneList = this.script.querySelectorAll(`Scenes scene[id="${id}"]`);
        const l = sceneList.length;
        if (l === 1) return sceneList[0];
        else if (l > 1) throw new Error(`Multiple scenes with the same id "${id}" exist in <Scenes>.`);
        else throw new Error(`A scene with id "${id}" does not exist in <Scenes>.`);
    }
    gotoNode() {
        if (this.nextNodeName === null) this.nextNodeName = 'default';
        this.currentNode = this.getNodeByID(this.currentScene,this.nextNodeName);
        this.nextNodeName = null;
        this.promptsArray.length = this.choicesArray.length = 0;
        this.addEventListener(this.PARSE_PROMPT,this.onParsePrompt);
        this.parsePromptList();
    }
    getNodeByID(scene,nodeID) {
        const nodeList = scene.querySelectorAll(`node[id="${nodeID}"]`);
        const l = nodeList.length;
        if (l === 1) return nodeList[0];
        else if (l > 1) throw new Error(`Multiple nodes with the same id "${nodeID}" exist in scene "${scene.getAttribute('id')}".`);
        else throw new Error(`Node "${nodeID}" does not exist in scene "${scene.getAttribute('id')}".`);
    }
    parsePromptList() {
        const promptList = this.currentNode.querySelectorAll('prompt');
        for (const prompt of promptList) {
            if (prompt.hasAttribute('sceneID') && prompt.hasAttribute('nodeID') && prompt.hasAttribute('promptID')) {
                const scene = this.getSceneByID(prompt.getAttribute('sceneID'));
                const node = this.getNodeByID(scene, prompt.getAttribute('nodeID'));
                prompt = this.getChildByID(node, ELEMENT_PROMPT, prompt.getAttribute('promptID'));
            }
            
            if (this.evaluateXML(prompt)) this.promptsArray.push(prompt);
        }
        this.parseModifyVarArray(this.promptsArray);
        this.dispatchEventWith(this.PARSE_PROMPT);
    }
    getChildByID(parent, childType, id) {
        const list = parent.querySelectorAll(childType);
        const matches = [];
        for (const child of list) {
            if (child.hasAttribute('id') && child.getAttribute('id') === id) matches.push(child);
        }
        const l = matches.length;
        if (l === 1) return matches[0];
        else if (l === 0) throw new Error(`Parent has children of type <${childType}>, but there is no child with id "${id}".`);
        else if (l > 1) throw new Error(`Parent has children of type <${childType}>, but there is more than one child with id "${id}".`);
        throw new Error(`Parent does not have any children of type <${childType}>.`);
    }
    evaluateXML(xml) {
        const conditionList = xml.querySelectorAll('condition');
        if (conditionList.length > 0) {
            for (const condition of conditionList) {
                if (condition.hasAttribute('sceneID') && condition.hasAttribute('nodeID') && condition.hasAttribute('conditionID')) {
                    let parentType, parentID, gotoID;
                    if (condition.hasAttribute('promptID')) {
                        parentType = 'prompt';
                        parentID = condition.getAttribute('promptID');
                    } else if (condition.hasAttribute('choiceID')) {
                        parentType = 'choice';
                        parentID = condition.getAttribute('choiceID');
                        if (condition.hasAttribute('gotoID')) gotoID = condition.getAttribute('gotoID');
                    }
                    condition = getConditionByReference(
                        condition.getAttribute('sceneID'),
                        condition.getAttribute('nodeID'),
                        parentType,
                        parentID,
                        condition.getAttribute('conditionID'),
                        gotoID
                    );
                }
                const variable = condition.getAttribute('varID');
                const operator = condition.getAttribute('operator');
                const value = parseFloat(condition.getAttribute('value'));
                if (!evaluate(variable, operator, value)) return false;
            }
            return true;
        } else return true;
    }
    getConditionByReference(sceneID, nodeID, parentType, parentID, conditionID, gotoID) {
        const scene = this.getSceneByID(sceneID);
        const node = this.getNodeByID(scene, nodeID);
        let condition;
        if (parentType && parentID) {
            if (parentType === 'prompt') {
                const prompt = this.getChildByID(node, 'prompt', parentID);
                condition = this.getChildByID(prompt, 'condition', conditionID);
            } else if (parentType === 'choice') {
                const choice = this.getChildByID(node, 'choice', parentID);
                if (gotoID) {
                    const gotoXML = this.getChildByID(choice, 'goto', gotoID);
                    condition = this.getChildByID(gotoXML, 'condition', conditionID);
                } else condition = this.getChildByID(choice, 'condition', conditionID);
            }
        } else condition = this.getChildByID(node, 'condition', conditionID);
        if (condition) return condition;
        else {
            let string = `Condition "${conditionID}" does not exist in scene "${sceneID}" node "${nodeID}" ${parentType} "${parentID}"`;
            if (gotoID) string += ` goto "${gotoID}".`;
            else string += '.';
            throw new Error(string);
        }
    }
    evaluate(variable, operator, value) {
        const testValue = variables.getVar(variable);
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
            default:
                throw new Error(`Operator "${operator}" is invalid. Did you mean "=="?`);
        }
    }
    parseModifyVarArray(xmlArray) {
        const sceneID = this.currentScene.getAttribute('id');
        const nodeID = this.currentNode.getAttribute('id');
        this.variables.incVar(`${sceneID}.${nodeID}`, 1);
        for (const xml of xmlArray) {
            this.parseModifyVarList(xml);
        }
    }
    parseModifyVarList(xml) {
        const modifyVarList = xml.querySelectorAll('modifyVar');
        for (const modifyVar of modifyVarList) {
            const variable = modifyVar.getAttribute('varID');
            const command = modifyVar.getAttribute('command');
            const value = parseFloat(modifyVar.getAttribute('value'));
            if (command === 'setVar') this.variableObject.setVar(variable, value);
            else if (command === 'incVar') this.variableObject.incVar(variable, value);
            else if (command === 'decVar') this.variableObject.decVar(variable, value);
        }
    }
    onParsePrompt() {
        this.removeEventListener(this.PARSE_PROMPT,this.onParsePrompt);
        if (promptsArray.length > 0) this.loadPromptAudio();
        else this.parseChoice();
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