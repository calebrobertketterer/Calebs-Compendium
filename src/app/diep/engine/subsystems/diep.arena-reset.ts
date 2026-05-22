import { Injectable } from '@angular/core';
import { TransitionManager } from '../../ui/diep.transition-manager';
import { DiepTimeManager } from '../../core/diep.time-manager';

@Injectable({ providedIn: 'root' })
export class DiepArenaResetService {
    public transition = new TransitionManager();

    constructor() {
        this.transition.fadeIn();
    }

    public updateTransition() {
        this.transition.update(DiepTimeManager.uiTick * 16.67);
    }

    public startNewGame(engine: any) {
        this.transition.fadeOut(() => {
            engine.resetState(true);
            engine.waveManager.startFirstWave(engine.enemies, engine.width, engine.height);
        });
        engine.startTicker(engine.onRenderCallback);
    }

    public restartGame(engine: any) {
        this.transition.fadeOut(() => {
            engine.resetState(true);
            engine.waveManager.startFirstWave(engine.enemies, engine.width, engine.height);
        });
        engine.startTicker(engine.onRenderCallback);
    }

    public exitToMenu(engine: any) {
        this.transition.fadeOut(() => {
            engine.resetState(false);
        });
        engine.startTicker(engine.onRenderCallback);
    }
}