import { IAEngine } from './IAEngine.js';
import { IAPlayer } from './IAPlayer.js';

export class Main {
    static engineDiv = document.getElementById('engineDiv');
    static overlayDiv = document.getElementById('overlayDiv');
    static popupDiv = document.getElementById('popupDiv');
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
        let scaleValue;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        if (isLandscape) {
            const percentageWidth = window.innerWidth * .2;
            scaleValue = Math.max(1, percentageWidth / IAPlayer.PLAYER_WIDTH);
        } else {
            const maxWidth = window.innerWidth - 20;
            scaleValue = maxWidth / IAPlayer.PLAYER_WIDTH;
        }
        //scaleValue = 1; //temp
        Main.engineDiv.style.transform = Main.popupDiv.style.transform = `scale(${scaleValue})`;
    }
    execEngine() {
        this.engine.exec();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Main();
});
document.addEventListener('dragstart', event => {
    event.preventDefault();
});