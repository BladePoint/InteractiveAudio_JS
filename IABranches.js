import { IAEngine } from './IAEngine.js';
import { UIElement } from '../UserInterface_JS/UIElement.js';
import { ShadedArrowBar, GlassPanel } from '../UserInterface_JS/iPlayer.js';
import { Button3State } from '../UserInterface_JS/UIButton.js'
import { TextField } from '../UserInterface_JS/TextField.js';
import { Tween } from '../Utilities_JS/Tween.js';

export class IABranches extends UIElement {
    static CHOSEN = 'chosen';
    constructor(options) {
        super();
        const {width, left=0, top=0, onSelect} = options;
        this.assignStyles({width, left, top});
        this.onSelect = onSelect;
        const offset = 10;
        ChoiceButton.choiceStyle = {width:width-offset*2, height:44, left:offset};
        this.buttonArray = [];
        this.onChoice = this.onChoice.bind(this);
        this.hideChoices = this.hideChoices.bind(this);
    }
    displayChoices(choiceArray) {
        choiceArray.forEach(choice => {this.buttonArray.push(ChoiceButton.getInstance(choice, this.onChoice));});
        const l = this.buttonArray.length;
        let displayedCount = 0;
        const testDisplayed = () => {
            displayedCount++;
            if (displayedCount === l) this.buttonArray.forEach(choiceButton => {
                choiceButton.unsuspend();
                choiceButton.testState();
            });
        }
        for (let i=0; i<l; i++) {
            const choiceButton = this.buttonArray[i];
            const top = (ChoiceButton.choiceStyle.height + 10 ) * i;
            choiceButton.assignStyles({top});
            this.appendChild(choiceButton);
            Tween.tweenOpacity(choiceButton, 1, .4, testDisplayed, i*.1);
        }
    }
    onChoice(chosenButton) {
        this.onSelect();
        chosenButton.removeMouseListeners();
        chosenButton.hoverState();
        const l = this.buttonArray.length;
        for (let i=0; i<l; i++) {
            const choiceButton = this.buttonArray[i];
            choiceButton.disable();
        };
        chosenButton.flash(6,360, this.hideChoices);
    }
    hideChoices(chosenButton) {
        const index = this.buttonArray.indexOf(chosenButton);
        this.buttonArray.splice(index, 1);
        this.buttonArray.push(chosenButton);
        const l = this.buttonArray.length;
        let hiddenCount = 0;
        const testHidden = () => {
            hiddenCount++;
            if (hiddenCount === l) {
                chosenButton.addMouseListeners();
                chosenButton.upState();
                this.buttonArray.length = 0;
                this.dispatchEventWith(IAEngine.COMPLETE_MADE_CHOICE, chosenButton.choice);
            }
        }
        for (let i=0; i<l; i++) {
            Tween.tweenOpacity(this.buttonArray[i], 0, .4, testHidden, i*.1);
        };
    }
}

class ChoiceButton extends Button3State {
    static choiceStyle;
    static pool = [];
    static getInstance(choice, onChoice) {
        let choiceButton;
        if (ChoiceButton.pool.length > 0) {
            choiceButton = ChoiceButton.pool.pop();
            choiceButton.parseChoice(choice);
        } else choiceButton = new ChoiceButton(choice, onChoice);
        choiceButton.enable();
        choiceButton.suspend();
        choiceButton.style.opacity = '0';
        return choiceButton;
    }
    static putInstance(choiceButton) {
        choiceButton.parseChoice(null);
        ChoiceButton.pool.push(choiceButton);
    }
    constructor(choice, onChoice) {
        const {width, height, left, top} = ChoiceButton.choiceStyle;
        const glassWidth = width - height;
        const halfHeight = height / 2;
        const container = new UIElement();
        const shadedArrowBar = new ShadedArrowBar({width, height});
        const glassPanel = new GlassPanel({width:glassWidth, height:26, colorString:GlassPanel.PURPLE, level:GlassPanel.LOW, left:halfHeight, top:9});
        const textField = new TextField({
            width: glassWidth,
            fontFamily: 'Consolas, monospace',
            fontSize: 18,
            textAlign: 'center',
            top: 12,
            left: halfHeight
        });
        container.appendChild(shadedArrowBar)
        container.appendChild(glassPanel);
        container.appendChild(textField);
        container.assignStyles({left, top});
        super(container, shadedArrowBar, onChoice);
        this.shadedArrowBar = shadedArrowBar;
        this.glassPanel = glassPanel;
        this.textField = textField;
        this.parseChoice(choice);
    }
    parseChoice(choice) {
        if (choice) this.textField.text = choice.textContent.trim();
        this.choice = choice;
    }
    hoverState() {
        this.shadedArrowBar.altState();
        this.glassPanel.setLevel(GlassPanel.NORMAL);
    }
    upState() {
        this.shadedArrowBar.defaultState();
        this.glassPanel.setLevel(GlassPanel.LOW);
    }
    downState() {
        this.shadedArrowBar.altState();
        this.glassPanel.setLevel(GlassPanel.HIGH);
    }
    flash(numberOfTimes, duration, onComplete=noop) {
        let isHigh = true;
        let count = 0;
        const interval = duration / (numberOfTimes * 2);
        const flashRecursive = () => {
            if (count < numberOfTimes) {
                isHigh = !isHigh;
                if (isHigh) this.downState();
                else this.hoverState();
                count++;
                setTimeout(flashRecursive, interval);
            } else {
                this.hoverState();
                setTimeout(onComplete, 100, this);
            }
        }
        flashRecursive();
    }
}