import { UIElement } from '../UserInterface_JS/UIElement.js';
import { CircleButton, DoubleProgressSeekBar, GlassPanel, RectButton, ShadedRect, TriangleShadow,
         iconDownGradient, iconUpGradient, ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX, ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX,
         SHADOW_UP_HEX, SHADOW_DOWN_HEX } from '../UserInterface_JS/iPlayer.js';
import { TextField } from '../UserInterface_JS/TextField.js';
import { AcuteTriangle, Rectangle } from '../UserInterface_JS/Primitives.js';
import { secondsToHHMMSS } from '../Utilities_JS/mathUtils.js';

export class IAPlayer extends UIElement {
    static PLAYER_WIDTH = 352;
    static PLAYER_HEIGHT = 103;
    rectButtonLeft = 6;
    rectButtonTop = 15;
    circleButtonLeft = 4;
    circleButtonTop = 51;
    sceneGlassWidth = 136;
    sceneGlassLeft = 108;
    rectButtonWidth = 44;
    rectButtonHeight = 32;
    circleButtonDiameter = 48;
    titleGlassWidth = 248;
    titleGlassLeft = 52;
    constructor() {
        super();
        this.replayFunction;
        this.pauseFunction;
        this.playFunction;
        this.skipFunction;
        this.createBackground();
        this.createRectButtons();
        this.createCircleButtons();
        this.createSeekBar();
        this.createText();
        this.appendChild(this.shadedRect);
        this.appendChild(this.titleGlass);
        this.appendChild(this.sceneGlass);
        this.appendChild(this.resetButton);
        this.appendChild(this.optionsButton);
        this.appendChild(this.replayButton);
        this.appendChild(this.pauseButton);
        this.appendChild(this.playButton);
        this.appendChild(this.skipButton);
        this.appendChild(this.iae);
        this.appendChild(this.titleText);
        this.appendChild(this.sceneText);
        this.appendChild(this.progressText);
        this.appendChild(this.totalText);
        this.appendChild(this.doubleProgressSeekBar);
        //this.disablePlayer();
        this.notReadyState();
    }
    createBackground() {
        this.shadedRect = new ShadedRect({width:IAPlayer.PLAYER_WIDTH, height:IAPlayer.PLAYER_HEIGHT});
        this.titleGlass = new GlassPanel({width:this.titleGlassWidth, height:32, left:this.titleGlassLeft, top:this.rectButtonTop});
        this.sceneGlass = new GlassPanel({width:this.sceneGlassWidth, height:26, left:this.sceneGlassLeft, top:this.circleButtonTop});
    }
    createRectButtons() {
        this.resetButton = new ResetButton({
            width: this.rectButtonWidth,
            height: this.rectButtonHeight,
            left: this.rectButtonLeft,
            top: this.rectButtonTop
        });
        this.optionsButton = new OptionsButton({
            width: this.rectButtonWidth,
            height: this.rectButtonHeight,
            left: IAPlayer.PLAYER_WIDTH - this.rectButtonWidth - this.rectButtonLeft,
            top: this.rectButtonTop
        });
    }
    createCircleButtons() {
        this.replayButton = new ReplayButton({
            upFunction: this.replayCallback,
            diameter:this.circleButtonDiameter,
            left:this.circleButtonLeft,
            top:this.circleButtonTop
        });
        this.pauseButton = new PauseButton({
            upFunction: this.pauseCallback,
            diameter: this.circleButtonDiameter,
            left:this.circleButtonLeft * 2 + this.circleButtonDiameter,
            top: this.replayButton.style.top
        });
        this.playButton = new PlayButton({
            upFunction: this.playCallback,
            diameter:this.circleButtonDiameter,
            left: IAPlayer.PLAYER_WIDTH - this.circleButtonLeft * 2 - this.circleButtonDiameter * 2,
            top: this.replayButton.style.top
        });
        this.skipButton = new SkipButton({
            upFunction: this.skipCallback,
            diameter:this.circleButtonDiameter, 
            left: IAPlayer.PLAYER_WIDTH - this.circleButtonLeft - this.circleButtonDiameter,
            top: this.replayButton.style.top
        });
    }
    createSeekBar() {
        this.doubleProgressSeekBar = new DoubleProgressSeekBar({
            width: this.sceneGlassWidth - 4,
            height: 6,
            left: this.sceneGlassLeft + 2,
            top: this.circleButtonTop + 30
        });
    }
    createText() {
        this.iae = new TextField({
            text: 'Interactive Audio Engine',
            width: IAPlayer.PLAYER_WIDTH,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            fontSize: 10,
            color: '#000000',
            textAlign: 'center',
            top: 2,
        });
        this.iae.style.textShadow = '1px 1px 0px #ffffff';
        this.titleText = new TextField({
            width: this.titleGlassWidth - 2,
            fontFamily: 'Consolas, monospace',
            fontSize: 16,
            textAlign: 'center',
            color: '#000000',
            top: `${this.rectButtonTop + 10}px`,
            left: `${this.titleGlassLeft + 1}px`
            
        });
        this.sceneText = new TextField({
            width: this.sceneGlassWidth - 2,
            fontFamily: 'Consolas, monospace',
            fontSize: 12,
            textAlign: 'center',
            color: '#000000',
            left: this.sceneGlassLeft + 1,
            top: this.circleButtonTop + 10
        });
        this.progressText = new TextField({
            text: '--:--',
            fontFamily: 'Consolas, monospace',
            fontSize: 10,
            textAlign: 'left',
            color: '#000000',
            left: this.sceneGlassLeft + 2,
            top: IAPlayer.PLAYER_HEIGHT - 14
        });
        this.totalText = new TextField({
            text: '--:--',
            fontFamily: 'Consolas, monospace',
            fontSize: 10,
            textAlign: 'right',
            color: '#000000',
            right: 2 -this.sceneGlassLeft - this.sceneGlassWidth,
            top: IAPlayer.PLAYER_HEIGHT - 14
        });
    }
    setTitleText(newText) {
        const cleanedText = this.cleanText(newText);
        this.titleText.text = cleanedText;
    }
    setSceneText(newText) {
        const cleanedText = this.cleanText(newText);
        this.sceneText.text = cleanedText;
    }
    setTotalTime(seconds) {
        this.totalText.text = secondsToHHMMSS(seconds);
    }
    setProgressTime(seconds) {
        this.progressText.text = secondsToHHMMSS(seconds);
    }
    setLoadProgress(percent) {
        this.doubleProgressSeekBar.setProgressRear(percent);
    }
    setPlayProgress(percent) {
        this.doubleProgressSeekBar.setProgressFront(percent);
    }
    cleanText(text) {
        return text.replace(/\n/g, ''); // Replace carriage returns with nothing
    }
    disablePlayer() {
        UIElement.assignStyles(this, {
            filter: 'brightness(50%)'
        });
    }
    notReadyState() {
        this.replayButton.disable();
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
    }
    initState() {
        this.playButton.enable();
    }
    playState() {
        this.replayButton.enable();
        this.pauseButton.enable();
        this.playButton.disable();
        this.skipButton.enable();
    }
    pauseState() {
        this.pauseButton.disable();
        this.playButton.enable();
    }
    doneState() {
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
    }
    replayCallback = () => {
        this.playState();
        this.replayFunction();
    }
    pauseCallback = () => {
        this.pauseState();
        this.pauseFunction();
    }
    playCallback = () => {
        this.playState();
        this.playFunction();
    }
    skipCallback = () => {
        this.doneState();
        this.skipFunction();
    }
}

class ResetButton extends RectButton {
    constructor(options) {
        super(options);
            
        }
    }

class OptionsButton extends RectButton {
    constructor(options) {
        super(options);
        
    }
}

class ReplayButton extends CircleButton {
    constructor(options) {
        super(options);
        
    }
}

class PauseButton extends CircleButton {
    constructor(options) {
        super(options);
        const rectWidth = 4;
        const rectHeight = 21;
        const leftL = 19;
        const leftR = leftL + 6;
        const upTop = 13.5;
        const leftShadowOptions = {
            width: rectWidth + 1,
            height: rectHeight +1,
            left: leftL - 1
        }
        const rightShadowOptions = {
            width: rectWidth + 1,
            height: rectHeight +1,
            left: leftR,
        }
        this.leftShadowUpOptions = {
            background: `linear-gradient(${SHADOW_DOWN_HEX}, #dddddd)`,
            top: upTop
        };
        this.rightShadowUpOptions = {
            background: `linear-gradient(${SHADOW_DOWN_HEX}, #dddddd)`,
            top: upTop
        };
        this.leftRectUpOptions = {
            width: rectWidth,
            height: rectHeight,
            background: `linear-gradient(${ICON_UP_TOP_HEX}, ${ICON_UP_BOTTOM_HEX})`,
            left: leftL,
            top: upTop
        }
        this.rightRectUpOptions = {
            width: rectWidth,
            height: rectHeight,
            background: `linear-gradient(${ICON_UP_TOP_HEX}, ${ICON_UP_BOTTOM_HEX})`,
            left: leftR,
            top: upTop
        }
        this.leftShadow = new Rectangle(leftShadowOptions);
        this.rightShadow = new Rectangle(rightShadowOptions);
        this.leftRect = new Rectangle(this.leftRectUpOptions);
        this.rightRect = new Rectangle(this.rightRectUpOptions);
        this.appendChild(this.leftShadow);
        this.appendChild(this.rightShadow);
        this.appendChild(this.leftRect);
        this.appendChild(this.rightRect);
    }
    downState() {
        super.downState();
        this.leftShadow.parseStateOptions(this.leftShadowDownOptions);
        this.rightShadow.parseStateOptions(this.rightShadowDownOptions);
        this.leftRect.parseStateOptions(this.leftRectDownOptions);
        this.rightRect.parseStateOptions(this.rightRectDownOptions);
    }
    upState() {
        super.upState();
        this.leftShadow.parseStateOptions(this.leftShadowUpOptions);
        this.rightShadow.parseStateOptions(this.rightShadowUpOptions);
        this.leftRect.parseStateOptions(this.leftRectUpOptions);
        this.rightRect.parseStateOptions(this.rightRectUpOptions);
    }
}

class PlayButton extends CircleButton {
    constructor(options) {
        super(options);
        const triangleOptions = {
            orientation: AcuteTriangle.RIGHT,
            width: 18,
            height: 21,
        };
        this.triangleUpOptions = {
            color: iconUpGradient,
            left: 18,
            top: 13.5
        }
        this.triangleDownOptions = {
            color: iconDownGradient,
            left: this.triangleUpOptions.left,
            top: 14
        }
        this.shadowUpOptions = {
            left: this.triangleUpOptions.left,
            top: this.triangleUpOptions.top,
            colorHex: SHADOW_UP_HEX
        };
        this.shadowDownOptions = {
            left: this.triangleUpOptions.left,
            top: this.triangleDownOptions.top,
            colorHex: SHADOW_DOWN_HEX
        };
        this.shadow = new TriangleShadow(triangleOptions);
        this.shadow.parseStateOptions(this.shadowUpOptions);
        this.triangle = new AcuteTriangle(triangleOptions);
        this.triangle.parseStateOptions(this.triangleUpOptions);
        this.appendChild(this.shadow);
        this.appendChild(this.triangle);
    }
    downState() {
        super.downState();
        this.shadow.parseStateOptions(this.shadowDownOptions);
        this.triangle.parseStateOptions(this.triangleDownOptions);
    }
    upState() {
        super.upState();
        this.shadow.parseStateOptions(this.shadowUpOptions);
        this.triangle.parseStateOptions(this.triangleUpOptions);
    }
}

class SkipButton extends CircleButton {
    constructor(options) {
        super(options);
        
    }
}