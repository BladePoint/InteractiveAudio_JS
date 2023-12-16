import { UIElement } from '../UserInterface_JS/UIElement.js';
import { UIButton } from '../UserInterface_JS/UIButton.js';
import { ShadedRect, GlassPanel, RectButton, CircleButton,
         TriangleShadow, RimmedBar, DoubleProgressSeekBar, TransitionRect,
         RIM_HEX, SHADOW_UP_HEX, SHADOW_DOWN_HEX, ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX, ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX,
         BAR_SHADOW_DEFAULT, BAR_SHADOW_ALT, BAR_RECT_DEFAULT, BAR_RECT_ALT } from '../UserInterface_JS/iPlayer.js';
import { TextField } from '../UserInterface_JS/TextField.js';
import { AcuteTriangle, Rectangle, getGradient } from '../UserInterface_JS/Primitives.js';
import { secondsToHHMMSS } from '../Utilities_JS/mathUtils.js';
import { LEFT, RIGHT, UP, NONE, LEFT_TO_RIGHT, RIGHT_TO_LEFT, TOP_TO_BOTTOM, BOTTOM_TO_TOP } from '../Utilities_JS/constants.js';
import { IAEngine } from './IAEngine.js';
import { Main } from './Main.js';

export class IAPlayer extends UIElement {
    static PLAYER_WIDTH = 352;
    static PLAYER_HEIGHT = 103;
    static STATE_NOT_READY = 'stateNotReady';
    static STATE_FIRST_READY = 'stateFirstReady';
    static STATE_PLAY = 'statePlay';
    static STATE_PAUSE = 'statePause';
    static STATE_DONE = 'stateDone';
    static CIRCLE_ICON_DEFAULT_TOP = 14;
    static CIRCLE_ICON_ALT_TOP = IAPlayer.CIRCLE_ICON_DEFAULT_TOP + .25;
    static rectButton = {width:44, height:32, left:6, top:15};
    static vBarInit = {width:5, height:20, barHex:BAR_RECT_DEFAULT};
    static vBarDefault = {background:BAR_SHADOW_DEFAULT, barHex:BAR_RECT_DEFAULT, top:IAPlayer.CIRCLE_ICON_DEFAULT_TOP};
    static vBarAlt = {background:BAR_SHADOW_ALT, barHex:BAR_RECT_ALT, top:IAPlayer.CIRCLE_ICON_ALT_TOP};
    constructor() {
        super();
        this.replayFunction;
        this.pauseFunction;
        this.playFunction;
        this.skipFunction;
        const titleGlassLeft = 52;
        const titleGlassWidth = IAPlayer.PLAYER_WIDTH - titleGlassLeft*2;
        const sceneGlassLeft = 108;
        const sceneGlassWidth = IAPlayer.PLAYER_WIDTH - sceneGlassLeft*2;
        const circleButtonLeft = 4;
        const circleButtonTop = 51;
        this.assignStyles({width:IAPlayer.PLAYER_WIDTH, height:IAPlayer.PLAYER_HEIGHT});
        const createBackground = () => {
            this.shadedRect = new ShadedRect({width:IAPlayer.PLAYER_WIDTH, height:IAPlayer.PLAYER_HEIGHT});
            this.titleGlass = new GlassPanel({width:titleGlassWidth, height:32, left:titleGlassLeft, top:IAPlayer.rectButton.top});
            this.sceneGlass = new GlassPanel({width:sceneGlassWidth, height:26, left:sceneGlassLeft, top:circleButtonTop, rimHex:'#dddddd'});
        }
        const createRectButtons = () => {
            const rectButton = IAPlayer.rectButton;
            this.resetButton = new ResetButton({
                width: rectButton.width,
                height: rectButton.height,
                left: rectButton.left,
                top: rectButton.top
            });
            this.optionsButton = new OptionsButton({
                upFunction: this.optionsCallback,
                width: rectButton.width,
                height: rectButton.height,
                left: IAPlayer.PLAYER_WIDTH - rectButton.width - rectButton.left,
                top: rectButton.top
            });
            this.resetButton.enable();
            this.optionsButton.enable();
        }
        const createCircleButtons = () => {
            const diameter = 48;
            this.replayButton = new ReplayButton({
                upFunction: this.replayCallback,
                diameter,
                left: circleButtonLeft,
                top: circleButtonTop
            });
            this.pauseButton = new PauseButton({
                upFunction: this.pauseCallback,
                diameter,
                left: circleButtonLeft * 2 + diameter,
                top: circleButtonTop
            });
            this.playButton = new PlayButton({
                upFunction: this.playCallback,
                diameter,
                left: IAPlayer.PLAYER_WIDTH - circleButtonLeft * 2 - diameter * 2,
                top: circleButtonTop
            });
            this.skipButton = new SkipButton({
                upFunction: this.skipCallback,
                diameter,
                left: IAPlayer.PLAYER_WIDTH - circleButtonLeft - diameter,
                top: circleButtonTop
            });
        }
        const createSeekBar = () => {
            this.doubleProgressSeekBar = new DoubleProgressSeekBar({
                width: sceneGlassWidth - 4,
                height: 6,
                left: sceneGlassLeft + 2,
                top: circleButtonTop + 30
            });
        }
        const createText = () => {
            const iaeDimensions = {width:117, height:11, left:(IAPlayer.PLAYER_WIDTH - 117)/2, top:2};
            const iae = new TextField({
                text: 'Interactive Audio Engine',
                width: iaeDimensions.width,
                height: iaeDimensions.height,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fontSize: 10,
                color: '#000000',
                textAlign: 'center',
                left: iaeDimensions.left,
                top: iaeDimensions.top
            });
            iae.style.textShadow = '1px 1px 0px #ffffff';
            iae.style.overflow = 'visible';
            this.iae = new UIButton(iae, null, this.iaeCallback);
            this.iae.buttonDimensions = iaeDimensions;
            this.iae.enable();
            this.titleText = new TextField({
                width: titleGlassWidth - 2,
                fontFamily: 'Consolas, monospace',
                fontWeight: 'bold',
                fontSize: 18,
                textAlign: 'center',
                color: '#000000',
                top: IAPlayer.rectButton.top + 9,
                left: titleGlassLeft + 1
            });
            this.sceneText = new TextField({
                width: sceneGlassWidth - 2,
                fontFamily: 'Consolas, monospace',
                fontSize: 12,
                textAlign: 'center',
                color: '#000000',
                left: sceneGlassLeft + 1,
                top: circleButtonTop + 10
            });
            this.progressText = new TextField({
                text: '--:--',
                fontFamily: 'Consolas, monospace',
                fontSize: 10,
                textAlign: 'left',
                color: '#000000',
                left: sceneGlassLeft + 2,
                top: IAPlayer.PLAYER_HEIGHT - 14
            });
            this.totalText = new TextField({
                text: '--:--',
                fontFamily: 'Consolas, monospace',
                fontSize: 10,
                textAlign: 'right',
                color: '#000000',
                right: sceneGlassLeft + 2,
                top: IAPlayer.PLAYER_HEIGHT - 14
            });
        }
        createBackground();
        createRectButtons();
        createCircleButtons();
        createSeekBar();
        createText();
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
        this.notReadyState();
    }
    setTitleText(newText) {this.titleText.text = this.cleanText(newText);}
    setSceneText(newText) {this.sceneText.text = this.cleanText(newText);}
    setTotalTime(seconds) {this.totalText.text = secondsToHHMMSS(seconds);}
    setProgressTime(seconds) {this.progressText.text = secondsToHHMMSS(seconds);}
    setProgressToZero() {this.setPlayProgress(0); this.setProgressTime(0);}
    setProgressToTotal() {this.setPlayProgress(100); this.progressText.text = this.totalText.text;}
    setLoadProgress(percent) {this.doubleProgressSeekBar.rearProgress = percent;}
    setPlayProgress(percent) {this.doubleProgressSeekBar.frontProgress = percent;}
    cleanText(text) {return text.replace(/\n/g, '');} // Replace carriage returns with nothing.
    notReadyState() {
        this.replayButton.disable();
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
    }
    firstReadyState() {
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
        this.replayButton.enable();
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
    }
    iaeCallback = (iae) => {
        IAEngine.popup(this.iae, this.credits);
    }
    get credits() {
        if (this._credits === undefined) {
            const width = 258;
            this._credits = new ShadedRect({
                width,
                height: 110,
                left: (IAPlayer.PLAYER_WIDTH - width) / 2,
                top: 15
            });
            const textField = new TextField({textAlign:'center', left:'50%', top:0, transform:'translate(-50%)'});
            textField.htmlText = `
                <span style="font-size:12px">created by</span><br>
                <span style="font-weight:bold">BladePoint</span><br>
                <span style="font-size:12px; display:inline-block; margin-top:10px">support me at:</span><br>
                <a href="https://www.patreon.com/BladePoint" target="_blank" style="font-family:'Segoe UI','San Francisco',sans-serif">www.patreon.com/BladePoint</a><br>
                <a href="https://www.subscribestar.com/bladepoint " target="_blank" style="font-family:'Segoe UI','San Francisco',sans-serif">www.subscribestar.com/bladepoint</a>
            `;
            textField.enable();
            this._credits.appendChild(textField);
            this._credits.enable();
        }
        return this._credits;
    }
    optionsCallback = (optionsButton) => {
        IAEngine.popup(optionsButton, optionsButton.menu);
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
        const altDelta = .25;
        const iconWidth = 20;
        const iconLeft = (options.width - iconWidth) / 2;
        const triangleTop = 9.5;
        const triangleHeight = 8;
        const triangleOptions = {orientation:UP, width:iconWidth, height:triangleHeight};
        this.defaultShadow = {color:SHADOW_UP_HEX, left:iconLeft, top:triangleTop};
        this.altShadow = {color:SHADOW_DOWN_HEX, left:iconLeft, top:triangleTop+altDelta};
        this.shadow = new TriangleShadow({...triangleOptions, ...this.defaultShadow});
        this.defaultTriangle = {
            color: getGradient('iconUp', [ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: iconLeft,
            top: triangleTop
        }
        this.altTriangle = {
            color: getGradient('iconDown', [ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: iconLeft,
            top: this.defaultTriangle.top + altDelta
        }
        this.triangle = new AcuteTriangle({...triangleOptions, ...this.defaultTriangle});
        const barTop = triangleTop + triangleHeight + 2;
        this.hBarDefault = {background:RIM_HEX, barHex:ICON_UP_BOTTOM_HEX, top:barTop};
        this.hBarAlt = {background:SHADOW_DOWN_HEX, barHex:ICON_DOWN_BOTTOM_HEX, top:barTop+altDelta};
        this.hBar = new RimmedBar({...this.hBarDefault, rimSide:NONE, width:iconWidth, height:3, left:iconLeft});
        this.rectRimGroup.appendChild(this.shadow);
        this.rectRimGroup.appendChild(this.triangle);
        this.rectRimGroup.appendChild(this.hBar);
    }
    downState() {
        super.downState();
        this.shadow.colorAndPosition(this.altShadow);
        this.triangle.colorAndPosition(this.altTriangle);
        this.hBar.assignStyles(this.hBarAlt);
    }
    upState() {
        super.upState();
        this.shadow.colorAndPosition(this.defaultShadow);
        this.triangle.colorAndPosition(this.defaultTriangle);
        this.hBar.assignStyles(this.hBarDefault);
    }
}

class OptionsButton extends RectButton {
    constructor(options) {
        super(options);
        const barLeft = 12;
        const barWidth = options.width - barLeft*2 + 1;
        const barHeight = 3;
        const barGap = barHeight + 2;
        const firstTop = 9.5;
        const secondTop = firstTop + barGap;
        const thirdTop = secondTop + barGap;
        const altDelta = .25;
        const hBarInit = {rimSide:RIGHT, width:barWidth, height:barHeight, left:barLeft};
        const hBarDefault = {background:RIM_HEX, barHex:ICON_UP_BOTTOM_HEX};
        const hBarAlt = {background:SHADOW_DOWN_HEX, barHex:ICON_DOWN_BOTTOM_HEX};
        this.defaultFirst = {...hBarDefault, top:firstTop};
        this.altFirst = {...hBarAlt, top:firstTop+altDelta};
        this.defaultSecond = {...hBarDefault, top:secondTop};
        this.altSecond = {...hBarAlt, top:secondTop+altDelta};
        this.defaultThird = {...hBarDefault, top:thirdTop};
        this.altThird = {...hBarAlt, top:thirdTop+altDelta};
        this.firstBar = new RimmedBar({...hBarInit, ...this.defaultFirst});
        this.secondBar = new RimmedBar({...hBarInit, ...this.defaultSecond});
        this.thirdBar = new RimmedBar({...hBarInit, ...this.defaultThird});
        this.rectRimGroup.appendChild(this.firstBar);
        this.rectRimGroup.appendChild(this.secondBar);
        this.rectRimGroup.appendChild(this.thirdBar);
    }
    get menu() {
        if (this._menu === undefined) {
            const {width, height, left, top} = IAPlayer.rectButton;
            this._menu = new ShadedRect({
                width: IAPlayer.PLAYER_WIDTH - (left+top)*2,
                height: 100,
                left: left + top,
                top: top + left
            });
            this._menu.enable();
        }
        return this._menu;
    }
    downState() {
        super.downState();
        this.firstBar.assignStyles(this.altFirst);
        this.secondBar.assignStyles(this.altSecond);
        this.thirdBar.assignStyles(this.altThird);
    }
    upState() {
        super.upState();
        this.firstBar.assignStyles(this.defaultFirst);
        this.secondBar.assignStyles(this.defaultSecond);
        this.thirdBar.assignStyles(this.defaultThird);
    }
}

class ReplayButton extends CircleButton {
    constructor(options) {
        const {upFunction, diameter, left, top} = options;
        super({upFunction, width:diameter, height:diameter, left, top});
        this.init();
        this.circleRimGroup.appendChild(this.vBar);
        this.circleRimGroup.appendChild(this.shadow);
        this.circleRimGroup.appendChild(this.triangle);
    }
    init() {this.initElements({barRimSide:LEFT, barLeft:14, triangleOrientation:LEFT, triangleLeft:19});}
    initElements(initOptions) {
        const {barRimSide, barLeft, triangleOrientation, triangleLeft} = initOptions;
        this.vBar = new RimmedBar({...IAPlayer.vBarInit, ...IAPlayer.vBarDefault, rimSide:barRimSide, left:barLeft});
        const triangleOptions = {orientation:triangleOrientation, width:15, height:19};
        this.defaultShadow = {color:SHADOW_UP_HEX, left:triangleLeft, top:IAPlayer.CIRCLE_ICON_DEFAULT_TOP};
        this.altShadow = {color:SHADOW_DOWN_HEX, left:triangleLeft, top:IAPlayer.CIRCLE_ICON_ALT_TOP};
        this.shadow = new TriangleShadow({...triangleOptions, ...this.defaultShadow});
        this.defaultTriangle = {
            color: getGradient('iconUp', [ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: triangleLeft,
            top: IAPlayer.CIRCLE_ICON_DEFAULT_TOP
        }
        this.altTriangle = {
            color: getGradient('iconDown', [ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: triangleLeft,
            top: IAPlayer.CIRCLE_ICON_ALT_TOP
        }
        this.triangle = new AcuteTriangle({...triangleOptions, ...this.defaultTriangle});
    }
    downState() {
        super.downState();
        this.vBar.assignStyles(IAPlayer.vBarAlt);
        this.shadow.colorAndPosition(this.altShadow);
        this.triangle.colorAndPosition(this.altTriangle);
    }
    upState() {
        super.upState();
        this.vBar.assignStyles(IAPlayer.vBarDefault);
        this.shadow.colorAndPosition(this.defaultShadow);
        this.triangle.colorAndPosition(this.defaultTriangle);
    }
}

class PauseButton extends CircleButton {
    constructor(options) {
        const {upFunction, diameter, left, top} = options;
        super({upFunction, width:diameter, height:diameter, left, top});
        const leftBarLeft = 18;
        const rightBarLeft = leftBarLeft + 7;
        this.leftBar = new RimmedBar({...IAPlayer.vBarInit, ...IAPlayer.vBarDefault, rimSide:LEFT, left:leftBarLeft});
        this.rightBar = new RimmedBar({...IAPlayer.vBarInit, ...IAPlayer.vBarDefault, rimSide:RIGHT, left:rightBarLeft});
        this.circleRimGroup.appendChild(this.leftBar);
        this.circleRimGroup.appendChild(this.rightBar);
    }
    downState() {
        super.downState();
        this.leftBar.assignStyles(IAPlayer.vBarAlt);
        this.rightBar.assignStyles(IAPlayer.vBarAlt);
    }
    upState() {
        super.upState();
        this.leftBar.assignStyles(IAPlayer.vBarDefault);
        this.rightBar.assignStyles(IAPlayer.vBarDefault);
    }
}

class PlayButton extends CircleButton {
    constructor(options) {
        const {upFunction, diameter, left, top} = options;
        super({upFunction, width:diameter, height:diameter, left, top});
        const defaultTop = IAPlayer.CIRCLE_ICON_DEFAULT_TOP - 2;
        const altTop = IAPlayer.CIRCLE_ICON_ALT_TOP - 2;
        const triangleLeft = 18;
        const triangleOptions = {orientation:RIGHT, width:18, height:23};
        this.defaultShadow = {color:SHADOW_UP_HEX, left:triangleLeft, top:defaultTop};
        this.altShadow = {color:SHADOW_DOWN_HEX, left:triangleLeft, top:altTop};
        this.shadow = new TriangleShadow({...triangleOptions, ...this.defaultShadow});
        this.defaultTriangle = {
            color: getGradient('iconUp', [ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: triangleLeft,
            top: defaultTop
        }
        this.altTriangle = {
            color: getGradient('iconDown', [ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: triangleLeft,
            top: altTop
        }
        this.triangle = new AcuteTriangle({...triangleOptions, ...this.defaultTriangle});
        this.circleRimGroup.appendChild(this.shadow);
        this.circleRimGroup.appendChild(this.triangle);
    }
    downState() {
        super.downState();
        this.shadow.colorAndPosition(this.altShadow);
        this.triangle.colorAndPosition(this.altTriangle);
    }
    upState() {
        super.upState();
        this.shadow.colorAndPosition(this.defaultShadow);
        this.triangle.colorAndPosition(this.defaultTriangle);
    }
}

class SkipButton extends ReplayButton {
    constructor(options) {super(options);}
    init() {this.initElements({barRimSide:RIGHT, barLeft:29, triangleOrientation:RIGHT, triangleLeft:14});}
}