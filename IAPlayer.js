import { UIElement, UIButton } from '../UserInterface_JS/UIElement.js';
import { ShadedRect, RectButton, CircleButton, GlassPanel, DoubleProgressSlider } from '../UserInterface_JS/iPlayer.js';
import { TextField } from '../UserInterface_JS/TextField.js';
import { AcuteTriangle, getGradient, LEFT_TO_RIGHT, RIGHT_TO_LEFT, TOP_TO_BOTTOM, BOTTOM_TO_TOP } from '../UserInterface_JS/Primitives.js';
//import { EqTriangle} from '../UserInterface_JS/Primitives.js';

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
        this.createBackground();
        this.createRectButtons();
        this.createCircleButtons();
        this.createSlider();
        this.createText();
        this.appendChild(this.shadedRect);
        this.appendChild(this.titleGlass);
        this.appendChild(this.sceneGlass);
        this.appendChild(this.resetButton);
        this.appendChild(this.optionsButton);
        this.appendChild(this.replayButton);
        this.appendChild(this.pauseButton);
        this.appendChild(this.skipButton);
        this.appendChild(this.playButton);
        this.appendChild(this.iae);
        this.appendChild(this.titleText);
        this.appendChild(this.sceneText);
        this.appendChild(this.progressText);
        this.appendChild(this.doubleProgressSlider);
        //this.disablePlayer();
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
            diameter:this.circleButtonDiameter,
            left:this.circleButtonLeft,
            top:this.circleButtonTop
        });
        this.pauseButton = new PauseButton({
            diameter: this.circleButtonDiameter,
            left:this.circleButtonLeft * 2 + this.circleButtonDiameter,
            top: this.replayButton.style.top
        });
        this.skipButton = new SkipButton({
            diameter:this.circleButtonDiameter, 
            left: IAPlayer.PLAYER_WIDTH - this.circleButtonLeft - this.circleButtonDiameter,
            top: this.replayButton.style.top
        });
        this.playButton = new PlayButton({
            diameter:this.circleButtonDiameter,
            left: IAPlayer.PLAYER_WIDTH - this.circleButtonLeft * 2 - this.circleButtonDiameter * 2,
            top: this.replayButton.style.top
        });
    }
    createSlider() {
        this.doubleProgressSlider = new DoubleProgressSlider({
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
        this.sceneText.style.whiteSpace = 'nowrap';
        this.progressText = new TextField({
            fontFamily: 'Consolas, monospace',
            fontSize: 10,
            textAlign: 'left',
            color: '#000000',
            left: this.sceneGlassLeft + 2,
            top: IAPlayer.PLAYER_HEIGHT - 14
        });
        //this.progressText.text = '--:--';
        this.progressText.text = '01:35';
    }
    setTitleText(newText) {
        const cleanedText = this.cleanText(newText);
        this.titleText.text = cleanedText;
    }
    setSceneText(newText) {
        const cleanedText = this.cleanText(newText);
        this.sceneText.text = cleanedText;
    }
    cleanText(text) {
        return text.replace(/\n/g, ''); // Replace carriage returns with nothing
    }
    disablePlayer() {
        UIElement.assignStyles(this, {
            filter: 'brightness(50%)'
        });
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
            color: getGradient('triangleUp', ['#000000', '#333333'], TOP_TO_BOTTOM),
            left: 18,
            top: 13.5
        }
        this.triangleDownOptions = {
            color: getGradient('triangleDown', ['#202020', '#363363'], TOP_TO_BOTTOM),
            left: this.triangleUpOptions.left,
            top: 14
        }
        this.shadowUpOptions = {
            left: this.triangleUpOptions.left,
            top: this.triangleUpOptions.top,
            colorHex: '#ffffff'
        };
        this.shadowDownOptions = {
            left: this.triangleUpOptions.left,
            top: this.triangleDownOptions.top,
            colorHex: '#bbbbbb'
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

class TriangleShadow extends UIElement {
    constructor(options) {
        super(UIElement.SVG);
        const {orientation = AcuteTriangle.UP, width, height} = options;
        this.polygon = this.drawPolygon(orientation, width, height);
        this.element.appendChild(this.polygon);
        UIElement.assignAttributes(this.element, {
            width,
            height: height + 1
        });
    }
    drawPolygon(orientation, width, height) {
        const polygon = UIElement.parseElementType(UIElement.POLYGON);
        let points;
        switch (orientation) {
            case AcuteTriangle.UP:
                //points = `0,${height} ${width/2},0 ${width},${height}`;
                break;
            case AcuteTriangle.DOWN:
                //points = `0,0 ${width/2},${height} ${width},0`;
                break;
            case AcuteTriangle.LEFT:
                //points = `${width},0 0,${height/2} ${width},${height}`;
                break;
            case AcuteTriangle.RIGHT:
                points = `0,0 ${width},${height/2} ${width},${height/2+1} 0,${height+1}`;
                break;
            default:
                throw new Error(`Invalid TriangleShadow orientation "${this.orientation}".`);
        }
        polygon.setAttribute('points', points);
        return polygon;
    }
    parseStateOptions(options) {
        this.element.setAttribute('transform', `translate(${options.left}, ${options.top})`);
        this.colorPolygon(options.colorHex);
    }
    colorPolygon(colorHex) {
        this.polygon.setAttribute("fill", colorHex);
    }
}