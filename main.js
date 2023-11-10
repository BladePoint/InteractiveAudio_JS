import { IAEngine } from './IAEngine.js';
import { IAPlayer } from './IAPlayer.js';

class Main {
    constructor() {
        this.engineDiv = document.getElementById('engineDiv');
        this.engine = new IAEngine('InteractiveAudioDemo_JS');
        this.engine.style.transform = `translateX(${IAPlayer.PLAYER_WIDTH/-2}px)`;
        this.initEngine();
        this.scaleEngine();
        this.execEngine();
    }
    initEngine() {
        this.engine.appendToParent(this.engineDiv);
    }
    scaleEngine() {
        let scaleValue;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        if (isLandscape) {
            const percentageWidth = window.innerWidth * 0.25;
            scaleValue = Math.max(1, percentageWidth / IAPlayer.PLAYER_WIDTH);
        } else {
            const maxWidth = window.innerWidth - 20;
            scaleValue = maxWidth / IAPlayer.PLAYER_WIDTH;
        }
        scaleValue = 1; //temp
        this.engineDiv.style.transform = `scale(${scaleValue})`;
    }
    execEngine() {
        //this.engine.exec();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Main();
});
document.addEventListener('dragstart', event => {
    event.preventDefault();
});