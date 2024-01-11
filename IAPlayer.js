import { UIElement } from '../UserInterface_JS/UIElement.js';
import { UIButton } from '../UserInterface_JS/UIButton.js';
import { ShadedRect, ShadedRectMenu, GlassPanel, RectButton, CircleButton,
         TriangleShadow, RimmedBar, DoubleProgressSeekBar, Slider, TransitionRect,
         RIM_HEX, SHADOW_UP_HEX, SHADOW_DOWN_HEX, ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX, ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX,
         BAR_SHADOW_DEFAULT, BAR_SHADOW_ALT, BAR_RECT_DEFAULT, BAR_RECT_ALT, ALT_DELTA } from '../UserInterface_JS/iPlayer.js';
import { TextField } from '../UserInterface_JS/TextField.js';
import { AcuteTriangle, Rectangle, getGradient } from '../UserInterface_JS/Primitives.js';
import { secondsToHHMMSS } from '../Utilities_JS/mathUtils.js';
import { LEFT, RIGHT, UP, NONE, LEFT_TO_RIGHT, RIGHT_TO_LEFT, TOP_TO_BOTTOM, BOTTOM_TO_TOP, BORDER_BOX } from '../Utilities_JS/constants.js';
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
    static ALT_DELTA = .25;
    static CIRCLE_ICON_DEFAULT_TOP = 14;
    static CIRCLE_ICON_ALT_TOP = IAPlayer.CIRCLE_ICON_DEFAULT_TOP + ALT_DELTA;
    static rectButton = {width:44, height:32, left:6, top:15};
    static vBarInit = {width:5, height:20, barHex:BAR_RECT_DEFAULT};
    static vBarDefault = {background:BAR_SHADOW_DEFAULT, barHex:BAR_RECT_DEFAULT, top:IAPlayer.CIRCLE_ICON_DEFAULT_TOP};
    static vBarAlt = {background:BAR_SHADOW_ALT, barHex:BAR_RECT_ALT, top:IAPlayer.CIRCLE_ICON_ALT_TOP};
    constructor(options) {
        super();
        const {getMasterVolume, setMasterVolume, getVoVolume, setVoVolume, getBgmVolume, setBgmVolume, saveSettings,
               replayCallback, pauseCallback, playCallback, skipCallback, seekCallback} = options;
        OptionsButton.getMasterVolume = getMasterVolume;
        OptionsButton.setMasterVolume = setMasterVolume;
        OptionsButton.getVoVolume = getVoVolume;
        OptionsButton.setVoVolume = setVoVolume;
        OptionsButton.getBgmVolume = getBgmVolume;
        OptionsButton.setBgmVolume = setBgmVolume;
        OptionsButton.saveSettings = saveSettings;
        const titleGlassLeft = 52;
        const titleGlassWidth = IAPlayer.PLAYER_WIDTH - titleGlassLeft*2;
        const sceneGlassLeft = 108;
        const sceneGlassWidth = IAPlayer.PLAYER_WIDTH - sceneGlassLeft*2;
        const circleButtonLeft = 4;
        const circleButtonTop = 51;
        this.assignStyles({width:IAPlayer.PLAYER_WIDTH, height:IAPlayer.PLAYER_HEIGHT});
        const createBackground = () => {
            this.shadedRect = new ShadedRect({width:IAPlayer.PLAYER_WIDTH, height:IAPlayer.PLAYER_HEIGHT});
            this.titleGlass = new GlassPanel({
                width:titleGlassWidth, height:32, left:titleGlassLeft, top:IAPlayer.rectButton.top,
                fontWeight:'bold', fontSize:'18px', textTop:-8
            });
            this.sceneGlass = new GlassPanel({
                width:sceneGlassWidth, height:26, rimHex:'#dddddd', left:sceneGlassLeft, top:circleButtonTop,
                fontSize:'12px', textTop:-5
            });
        }
        const createRectButtons = () => {
            const rectButton = IAPlayer.rectButton;
            this.infoButton = new InfoButton({
                execFunction: (infoButton) => {IAEngine.popup(infoButton, infoButton.menu);},
                width: rectButton.width,
                height: rectButton.height,
                left: rectButton.left,
                top: rectButton.top
            });
            this.optionsButton = new OptionsButton({
                execFunction: (optionsButton) => {IAEngine.popup(optionsButton, optionsButton.menu);},
                width: rectButton.width,
                height: rectButton.height,
                left: IAPlayer.PLAYER_WIDTH - rectButton.width - rectButton.left,
                top: rectButton.top
            });
            this.infoButton.enable();
            this.optionsButton.enable();
        }
        const createCircleButtons = () => {
            const diameter = 48;
            this.replayButton = new ReplayButton({
                execFunction: replayCallback,
                diameter,
                left: circleButtonLeft,
                top: circleButtonTop
            });
            this.pauseButton = new PauseButton({
                execFunction: pauseCallback,
                diameter,
                left: circleButtonLeft * 2 + diameter,
                top: circleButtonTop
            });
            this.playButton = new PlayButton({
                execFunction: playCallback,
                diameter,
                left: IAPlayer.PLAYER_WIDTH - circleButtonLeft * 2 - diameter * 2,
                top: circleButtonTop
            });
            this.skipButton = new SkipButton({
                execFunction: skipCallback,
                diameter,
                left: IAPlayer.PLAYER_WIDTH - circleButtonLeft - diameter,
                top: circleButtonTop
            });
        }
        const createSeekBar = () => {
            this.doubleProgressSeekBar = new DoubleProgressSeekBar({
                width: sceneGlassWidth,
                height: 6,
                left: sceneGlassLeft,
                top: circleButtonTop + 30,
                seekCallback: seekCallback
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
            this.iae = new UIButton(iae, null, (iae) => {IAEngine.popup(this.iae, this.credits);});
            this.iae.buttonDimensions = iaeDimensions;
            this.iae.addMouseListeners();
            this.iae.enable();
            const timeTop = IAPlayer.PLAYER_HEIGHT - 14;
            this.progressText = new TextField({
                text: '--:--',
                fontFamily: 'Consolas, monospace',
                fontSize: 10,
                textAlign: 'left',
                color: '#000000',
                left: sceneGlassLeft,
                top: timeTop
            });
            this.totalText = new TextField({
                text: '--:--',
                fontFamily: 'Consolas, monospace',
                fontSize: 10,
                textAlign: 'right',
                color: '#000000',
                right: sceneGlassLeft,
                top: timeTop
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
        this.appendChild(this.infoButton);
        this.appendChild(this.optionsButton);
        this.appendChild(this.replayButton);
        this.appendChild(this.pauseButton);
        this.appendChild(this.playButton);
        this.appendChild(this.skipButton);
        this.appendChild(this.iae);
        this.appendChild(this.progressText);
        this.appendChild(this.totalText);
        this.appendChild(this.doubleProgressSeekBar);
        this.notReadyState();
    }
    setInfoText(infoString) {
        InfoButton.parseInfoString(infoString);
        this.appendChild(InfoButton._infoTextField);
    }
    setTitleText(newText) {this.titleGlass.text = this.cleanText(newText);}
    setSceneText(newText) {this.sceneGlass.text = this.cleanText(newText);}
    setTotalTime(seconds) {this.totalText.text = secondsToHHMMSS(seconds);}
    setProgressTime(seconds) {this.progressText.text = secondsToHHMMSS(seconds);}
    setPlayProgressToZero() {this.setPlayProgress(0); this.setProgressTime(0);}
    setPlayProgressToTotal() {this.setPlayProgress(100); this.progressText.text = this.totalText.text;}
    setLoadProgress(decimal) {this.doubleProgressSeekBar.setProgressRear(decimal);}
    setPlayProgress(decimal) {this.doubleProgressSeekBar.setProgressFront(decimal);}
    cleanText(text) {return text.replace(/\n/g, '');}//Replace carriage returns with nothing.
    notReadyState() {
        this.replayButton.disable();
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
        this.doubleProgressSeekBar.disable();
    }
    firstReadyState() {
        this.playButton.enable();
    }
    playState() {
        this.replayButton.enable();
        this.pauseButton.enable();
        this.playButton.disable();
        this.skipButton.enable();
        this.doubleProgressSeekBar.enable();
    }
    pauseState() {
        this.pauseButton.disable();
        this.playButton.enable();
    }
    doneState() {
        this.doubleProgressSeekBar.enable();
        this.replayButton.enable();
        this.pauseButton.disable();
        this.playButton.disable();
        this.skipButton.disable();
    }
    get credits() {
        if (this._credits === undefined) {
            const width = 258;
            this._credits = new ShadedRectMenu({
                width,
                height: 110,
                left: (IAPlayer.PLAYER_WIDTH - width) / 2,
                top: 14
            });
            this._credits.style.transform = Main.transform;
            this._credits.enable();
            const textField = new TextField({textAlign:'center', left:'50%', top:-2, transform:'translate(-50%)'});
            textField.htmlText = `
                <span style="font-size:10px">created by</span><br>
                <span style="font-size:18px; font-weight:bold">BladePoint</span><br>
                <span style="font-size:12px; display:inline-block; margin-top:10px">support me at:</span>
            `;
            this._credits.appendChild(textField);
            const patreonAnchor = new UIElement(UIElement.A);
            patreonAnchor.assignStyles({width:width-2});
            patreonAnchor._element.href = 'https://www.patreon.com/BladePoint';
            patreonAnchor._element.target = '_blank';
            const logoSide = 52;
            const logoMargin = 10;
            const logoTop = 10;
            const patreonImg = new UIElement(UIElement.IMG);
            patreonImg.assignStyles({left:logoMargin, top:logoTop});
            patreonImg._element.src = '../../JavaScript/InteractiveAudio_JS/patreon.svg';
            patreonImg._element.alt = 'Patreon logo';
            patreonImg._element.width = patreonImg._element.height = logoSide;
            patreonImg.enable();
            patreonAnchor.appendChild(patreonImg);
            const fontFamily = '"Segoe UI", "San Francisco", sans-serif';
            const patreonText = new TextField({fontFamily, color:'#0066CC', left:'50%', top:63, transform:'translate(-50%)'});
            patreonText.text = 'www.patreon.com/BladePoint';
            patreonText.style.textDecoration = 'underline';
            patreonText.enable();
            patreonAnchor.appendChild(patreonText);
            const subscribestarAnchor = new UIElement(UIElement.A);
            subscribestarAnchor.assignStyles({width:width-2});
            subscribestarAnchor._element.href = 'https://www.subscribestar.com/bladepoint';
            subscribestarAnchor._element.target = '_blank';
            const subscribestarImg = new UIElement(UIElement.IMG);
            subscribestarImg.assignStyles({right:logoMargin, top:logoTop});
            subscribestarImg._element.src = '../../JavaScript/InteractiveAudio_JS/subscribestar.svg';
            subscribestarImg._element.alt = 'SubscribeStar logo';
            subscribestarImg._element.width = subscribestarImg._element.height = logoSide;
            subscribestarImg.enable();
            subscribestarAnchor.appendChild(subscribestarImg);
            const subscribestarText = new TextField({fontFamily, color:'#0066CC', left:'50%', top:83, transform:'translate(-50%)'});
            subscribestarText.text = 'www.subscribestar.com/bladepoint';
            subscribestarText.style.textDecoration = 'underline';
            subscribestarText.enable();
            subscribestarAnchor.appendChild(subscribestarText);
            this._credits.appendChild(patreonAnchor);
            this._credits.appendChild(subscribestarAnchor);
        }
        return this._credits;
    }
}

class InfoButton extends RectButton {
    static _menu = undefined;
    static parseInfoString(infoString) {
        const {left, top} = IAPlayer.rectButton;
        const textField = InfoButton._infoTextField = new TextField({
            width: IAPlayer.PLAYER_WIDTH - (left+top)*2,
            height: TextField.AUTO,
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#000000',
            textAlign: 'left',
            left: -1,
            top: -1
        });
        textField.assignStyles({
            overflowWrap: TextField.BREAK_WORD,
            whiteSpace: TextField.NORMAL,
            padding: '6px',
            boxSizing: BORDER_BOX,
            opacity: 0
        })
        textField.htmlText = infoString;
    }
    static _menu = undefined;
    constructor(options) {
        super(options);
        this.default = {color:ICON_UP_TOP_HEX, textShadow: `-1px .5px ${RIM_HEX}`, top:`calc(50% + 1px)`};
        this.alt = {color:ICON_DOWN_BOTTOM_HEX, textShadow: `-1px .5px ${SHADOW_DOWN_HEX}`, top:`calc(50% + ${1+ALT_DELTA}px)`};
        this.iLetter = new TextField({
            ...this.default,
            text: 'i',
            fontFamily: '"Georgia", serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            fontSize: 20,
            left:'50%',
            transform:'translate(-50%, -50%)'
        });
        /*const iconWidth = 20;
        const iconLeft = (options.width - iconWidth) / 2;
        const triangleTop = 9.5;
        const triangleHeight = 8;
        const triangleOptions = {orientation:UP, width:iconWidth, height:triangleHeight};
        this.defaultShadow = {color:SHADOW_UP_HEX, left:iconLeft, top:triangleTop};
        this.altShadow = {color:SHADOW_DOWN_HEX, left:iconLeft, top:triangleTop+ALT_DELTA};
        this.shadow = new TriangleShadow({...triangleOptions, ...this.defaultShadow});
        this.defaultTriangle = {
            color: getGradient('iconUp', [ICON_UP_TOP_HEX, ICON_UP_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: iconLeft,
            top: triangleTop
        }
        this.altTriangle = {
            color: getGradient('iconDown', [ICON_DOWN_TOP_HEX, ICON_DOWN_BOTTOM_HEX], TOP_TO_BOTTOM),
            left: iconLeft,
            top: this.defaultTriangle.top + ALT_DELTA
        }
        this.triangle = new AcuteTriangle({...triangleOptions, ...this.defaultTriangle});
        const barTop = triangleTop + triangleHeight + 2;
        this.hBarDefault = {background:RIM_HEX, barHex:ICON_UP_BOTTOM_HEX, top:barTop};
        this.hBarAlt = {background:SHADOW_DOWN_HEX, barHex:ICON_DOWN_BOTTOM_HEX, top:barTop+ALT_DELTA};
        this.hBar = new RimmedBar({...this.hBarDefault, rimSide:NONE, width:iconWidth, height:3, left:iconLeft});
        this.rectRimGroup.appendChild(this.shadow);
        this.rectRimGroup.appendChild(this.triangle);
        this.rectRimGroup.appendChild(this.hBar);*/
        this.pointerElement.appendChild(this.iLetter);
    }
    get menu() {
        if (InfoButton._menu === undefined) {
            const {width, height, left, top} = IAPlayer.rectButton;
            InfoButton._menu = new ShadedRectMenu({
                width: IAPlayer.PLAYER_WIDTH - (left+top)*2,
                height: InfoButton._infoTextField._element.offsetHeight,
                left: left + top,
                top: top + left
            });
            InfoButton._menu.style.transform = Main.transform;
            InfoButton._infoTextField.style.opacity = 1;
            InfoButton._menu.appendChild(InfoButton._infoTextField);
            InfoButton._menu.enable();
        }
        return InfoButton._menu;
    }
    downState() {
        super.downState();
        this.iLetter.assignStyles(this.alt);
    }
    upState() {
        super.upState();
        this.iLetter.assignStyles(this.default);
    }
}

class OptionsButton extends RectButton {
    static getMasterVolume = undefined;
    static setMasterVolume = undefined;
    static getVoVolume = undefined;
    static setVoVolume = undefined;
    static getBgmVolume = undefined;
    static setBgmVolume = undefined;
    static saveSettings = undefined;
    static _menu = undefined;
    constructor(options) {
        super(options);
        this.default = {color:ICON_UP_BOTTOM_HEX, textShadow: `0px 1px ${RIM_HEX}`, top:'-6%'};
        this.alt = {color:ICON_DOWN_BOTTOM_HEX, textShadow: `0px 1px ${SHADOW_DOWN_HEX}`, top:`calc(-6% + ${ALT_DELTA}px)`};
        this.iLetter = new TextField({
            ...this.default,
            text: '≡',
            height: options.height,
            fontFamily: '"Verdana", sans-serif',
            fontSize: 26,
            left: '50%',
            transform: 'translate(-50%, 0%) scaleX(1.28)'
        });
        /*const barLeft = 11;
        const barWidth = options.width - barLeft*2 - 1;
        const barHeight = 3;
        const barGap = barHeight + 2;
        const firstTop = 9.5;
        const secondTop = firstTop + barGap;
        const thirdTop = secondTop + barGap;
        const hBarInit = {rimSide:RIGHT, width:barWidth, height:barHeight, left:barLeft};
        const hBarDefault = {background:RIM_HEX, barHex:ICON_UP_BOTTOM_HEX};
        const hBarAlt = {background:SHADOW_DOWN_HEX, barHex:ICON_DOWN_BOTTOM_HEX};
        this.defaultFirst = {...hBarDefault, top:firstTop};
        this.altFirst = {...hBarAlt, top:firstTop+ALT_DELTA};
        this.defaultSecond = {...hBarDefault, top:secondTop};
        this.altSecond = {...hBarAlt, top:secondTop+ALT_DELTA};
        this.defaultThird = {...hBarDefault, top:thirdTop};
        this.altThird = {...hBarAlt, top:thirdTop+ALT_DELTA};
        this.firstBar = new RimmedBar({...hBarInit, ...this.defaultFirst});
        this.secondBar = new RimmedBar({...hBarInit, ...this.defaultSecond});
        this.thirdBar = new RimmedBar({...hBarInit, ...this.defaultThird});
        this.pointerElement.appendChild(this.firstBar);
        this.pointerElement.appendChild(this.secondBar);
        this.pointerElement.appendChild(this.thirdBar);*/
        this.pointerElement.appendChild(this.iLetter);
    }
    get menu() {
        if (OptionsButton._menu === undefined) {
            const {width, height, left, top} = IAPlayer.rectButton;
            const menuWidth = IAPlayer.PLAYER_WIDTH - (left+top)*2;
            OptionsButton._menu = new ShadedRectMenu({
                width: menuWidth,
                height: 61,
                left: left + top,
                top: top + left
            });
            OptionsButton._menu.style.transform = Main.transform;
            const volume = new TextField({
                text: 'Master Volume',
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                textAlign: 'center',
                left: '50%',
                top: 7,
                transform: 'translate(-50%)'
            });
            const margin = 15;
            OptionsButton._menu.masterVolumeSlider = new Slider({
                width: menuWidth-margin*2, height:8,
                setFunction: OptionsButton.setMasterVolume,
                scaleValue: Main.scaleValue,
                left: margin-1, top: 27
            });
            OptionsButton._menu.appendChild(volume);
            OptionsButton._menu.appendChild(OptionsButton._menu.masterVolumeSlider);
            OptionsButton._menu.enable();
            OptionsButton._menu.init = () => {
                OptionsButton._menu.masterVolumeSlider.addListeners();
            };
            OptionsButton._menu.fini = () => {
                OptionsButton._menu.masterVolumeSlider.removeListeners();
                OptionsButton.saveSettings();
            };
        }
        OptionsButton._menu.masterVolumeSlider.updateProgressByDecimal(OptionsButton.getMasterVolume());
        return OptionsButton._menu;
    }
    downState() {
        super.downState();
        this.iLetter.assignStyles(this.alt);
        /*this.firstBar.assignStyles(this.altFirst);
        this.secondBar.assignStyles(this.altSecond);
        this.thirdBar.assignStyles(this.altThird);*/
    }
    upState() {
        super.upState();
        this.iLetter.assignStyles(this.default);
        /*this.firstBar.assignStyles(this.defaultFirst);
        this.secondBar.assignStyles(this.defaultSecond);
        this.thirdBar.assignStyles(this.defaultThird);*/
    }
}

class ReplayButton extends CircleButton {
    constructor(options) {
        const {execFunction, diameter, left, top} = options;
        super({execFunction, width:diameter, height:diameter, left, top});
        this.init();
        this.pointerElement.appendChild(this.vBar);
        this.pointerElement.appendChild(this.shadow);
        this.pointerElement.appendChild(this.triangle);
    }
    init() {this.initElements({barRimSide:LEFT, barLeft:13, triangleOrientation:LEFT, triangleLeft:18});}
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
        const {execFunction, diameter, left, top} = options;
        super({execFunction, width:diameter, height:diameter, left, top});
        const leftBarLeft = 17;
        const rightBarLeft = leftBarLeft + 7;
        this.leftBar = new RimmedBar({...IAPlayer.vBarInit, ...IAPlayer.vBarDefault, rimSide:LEFT, left:leftBarLeft});
        this.rightBar = new RimmedBar({...IAPlayer.vBarInit, ...IAPlayer.vBarDefault, rimSide:RIGHT, left:rightBarLeft});
        this.pointerElement.appendChild(this.leftBar);
        this.pointerElement.appendChild(this.rightBar);
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
        const {execFunction, diameter, left, top} = options;
        super({execFunction, width:diameter, height:diameter, left, top});
        const defaultTop = IAPlayer.CIRCLE_ICON_DEFAULT_TOP - 2;
        const altTop = IAPlayer.CIRCLE_ICON_ALT_TOP - 2;
        const triangleLeft = 17;
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
        this.pointerElement.appendChild(this.shadow);
        this.pointerElement.appendChild(this.triangle);
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
    init() {this.initElements({barRimSide:RIGHT, barLeft:28, triangleOrientation:RIGHT, triangleLeft:13});}
}