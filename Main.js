import { IAEngine } from './IAEngine.js';
import { IAPlayer } from './IAPlayer.js';

export class Main {
    static instantiate() {
        document.removeEventListener('DOMContentLoaded', Main.instantiate);
        new Main();
    }
    static engineDiv = document.getElementById('engineDiv');
    static overlayDiv = document.getElementById('overlayDiv');
    static popupDiv = document.getElementById('popupDiv');
    static scaleValue = undefined;
    static transform = null;
    constructor() {
        this.engine = new IAEngine('InteractiveAudioDemo_HTML');
        this.engine.style.transform = Main.transform = `translateX(${IAPlayer.PLAYER_WIDTH/-2}px)`;
        this.initEngine();
        this.scaleEngine();
        this.execEngine();
    }
    initEngine() {
        this.engine.appendToParent(Main.engineDiv);
    }
    scaleEngine() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        if (isLandscape) {
            const percentageWidth = window.innerWidth * .2;
            Main.scaleValue = Math.max(1, percentageWidth / IAPlayer.PLAYER_WIDTH);
        } else {
            const maxWidth = window.innerWidth - 20;
            Main.scaleValue = maxWidth / IAPlayer.PLAYER_WIDTH;
        }
        //scaleValue = 1; //temp
        Main.engineDiv.style.transform = Main.popupDiv.style.transform = `scale(${Main.scaleValue})`;
    }
    execEngine() {
        this.engine.exec();
    }
}

document.addEventListener('DOMContentLoaded', Main.instantiate);
document.addEventListener('dragstart', (evt) => {
    evt.preventDefault();
});