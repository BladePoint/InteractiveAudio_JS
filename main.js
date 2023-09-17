import { IAEngine } from './IAEngine.js';
import { PLAYER_WIDTH } from './IAPlayer.js';

class Main {
  constructor() {
    this.engineDiv = document.getElementById('engineDiv');
    this.engine = new IAEngine();
    this.initEngine();
    this.scaleEngine();
    this.execEngine();
  }

  initEngine() {
    this.engine.appendChildTo(this.engineDiv);
  }

  scaleEngine() {
    let scaleValue;
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    if (isLandscape) {
      const percentageWidth = window.innerWidth * 0.25;
      scaleValue = Math.max(1, percentageWidth / PLAYER_WIDTH);
    } else {
      const maxWidth = window.innerWidth - 20;
      scaleValue = maxWidth / PLAYER_WIDTH;
    }
    this.engineDiv.style.transform = `scale(${scaleValue})`;
  }

  execEngine() {
    this.engine.exec();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});