import { UIElement } from '../../frameworks/UserInterface_JS/UIElement.js';
import { ShadedRect } from '../../frameworks/UserInterface_JS/iPlayer.js';
import { RectButton } from '../../frameworks/UserInterface_JS/iPlayer.js';
import { CircleButton } from '../../frameworks/UserInterface_JS/iPlayer.js';
import { GlassPanel } from '../../frameworks/UserInterface_JS/iPlayer.js';
import { SliderBar } from '../../frameworks/UserInterface_JS/iPlayer.js';
export const PLAYER_WIDTH = 352;
       const PLAYER_HEIGHT = 103;

export class IAPlayer extends UIElement {
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
        this.appendChild(this.progressBar);
    }
    createBackground() {
        this.shadedRect = new ShadedRect({width:PLAYER_WIDTH, height:PLAYER_HEIGHT});
        this.applyStyles(this.shadedRect, {
            pointerEvents: 'none'
        });
        this.titleGlass = new GlassPanel({width:this.titleGlassWidth, height:32});
        this.applyStyles(this.titleGlass, {
            position: 'absolute',
            left: `${this.titleGlassLeft}px`,
            top: `${this.rectButtonTop}px`
        });
        this.sceneGlass = new GlassPanel({width:this.sceneGlassWidth, height:26});
        this.applyStyles(this.sceneGlass, {
            position: 'absolute',
            left: `${this.sceneGlassLeft}px`,
            top: `${this.circleButtonTop}px`
        });
    }
    createRectButtons() {
        const rectButtonOptions = {
            width:this.rectButtonWidth,
            height:this.rectButtonHeight
        };
        this.resetButton = new ResetButton(rectButtonOptions);
        this.applyStyles(this.resetButton, {
            position: 'absolute',
            left: `${this.rectButtonLeft}px`,
            top: `${this.rectButtonTop}px`
        });
        this.optionsButton = new OptionsButton(rectButtonOptions);
        this.applyStyles(this.optionsButton, {
            position: 'absolute',
            left: `${PLAYER_WIDTH - this.rectButtonWidth - this.rectButtonLeft}px`,
            top: `${this.rectButtonTop}px`
        });
    }
    createCircleButtons() {
        const circleButtonOptions = {
            diameter:this.circleButtonDiameter
        };
        this.replayButton = new ReplayButton(circleButtonOptions);
        this.applyStyles(this.replayButton, {
            position: 'absolute',
            left: `${this.circleButtonLeft}px`,
            top: `${this.circleButtonTop}px`
        });
        this.pauseButton = new PauseButton(circleButtonOptions);
        this.applyStyles(this.pauseButton, {
            position: 'absolute',
            left: `${this.circleButtonLeft * 2 + this.circleButtonDiameter}px`,
            top: this.replayButton.style.top
        });
        this.skipButton = new SkipButton(circleButtonOptions);
        this.applyStyles(this.skipButton, {
            position: 'absolute',
            left: `${PLAYER_WIDTH - this.circleButtonLeft - this.circleButtonDiameter}px`,
            top: this.replayButton.style.top
        });
        this.playButton = new PlayButton(circleButtonOptions);
        this.applyStyles(this.playButton, {
            position: 'absolute',
            left: `${PLAYER_WIDTH - this.circleButtonLeft * 2 - this.circleButtonDiameter * 2}px`,
            top: this.replayButton.style.top
        });
    }
    createSlider() {
        this.progressBar = new SliderBar({width:this.sceneGlassWidth - 4, height:6});
        this.applyStyles(this.progressBar, {
            position: 'absolute',
            left: `${this.sceneGlassLeft + 2}px`,
            top: `${this.circleButtonTop + 30}px`
        });
    }
    createText() {
        this.iae = document.createElement('div');
        this.iae.innerText = 'Interactive Audio Engine';
        this.applyStyles(this.iae, {
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            fontSize: '10px',
            color: '#000000',
            textShadow: '1px 1px 0px #ffffff',
            position: 'absolute',
            top: '2px',
            left: '50%', // Center the text horizontally
            transform: 'translateX(-50%)' // Center the text horizontally
        });
        this.titleText = document.createElement('div');
        this.applyStyles(this.titleText, {
            width: `${this.titleGlassWidth - 2}px`,
            fontFamily: 'Consolas, monospace',
            fontSize: '16px',
            textAlign: 'center',
            color: '#000000',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            position: 'absolute',
            top: `${this.rectButtonTop + 10}px`,
            left: `${this.titleGlassLeft + 1}px`
            //, border: '2px solid red',
            //boxSizing: 'border-box'
        });
        this.sceneText = document.createElement('div');
        //this.sceneText.innerText = 'Interactive Audio Engine';
        this.applyStyles(this.sceneText, {
            width: `${this.sceneGlassWidth - 2}px`,
            fontFamily: 'Consolas, monospace',
            fontSize: '12px',
            textAlign: 'center',
            color: '#000000',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            position: 'absolute',
            top: `${this.circleButtonTop + 10}px`,
            left: `${this.sceneGlassLeft + 1}px`
        });
        this.progressText = document.createElement('div');
        this.applyStyles(this.progressText, {
            fontFamily: 'Consolas, monospace',
            fontSize: '10px',
            textAlign: 'left',
            userSelect: 'none',
            color: '#000000',
            position: 'absolute',
            top: `${PLAYER_HEIGHT - 14}px`,
            left: `${this.sceneGlassLeft + 2}px`
        });
        //this.progressText.innerText = '--:--';
        this.progressText.innerText = '01:35';
    }
    setTitleText(newText) {
        const cleanedText = this.cleanText(newText);
        this.titleText.innerText = cleanedText;
    }
    setSceneText(newText) {
        const cleanedText = this.cleanText(newText);
        this.sceneText.innerText = cleanedText;
    }
    cleanText(text) {
        return text.replace(/\n/g, ''); // Replace carriage returns with nothing
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
        
    }
}

class SkipButton extends CircleButton {
    constructor(options) {
        super(options);
        
    }
}