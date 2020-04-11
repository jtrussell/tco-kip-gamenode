class Clock {
    constructor(player, timeAllocation) {
        this.player = player;
        this.timeAllocation = timeAllocation;
        this.timeLeft = timeAllocation;
        this.timeTurnStarted = 0;
        this.mode = 'off';
        this.paused = false;
    }

    pause() {
        //this.paused = true;
    }

    restart() {
        //this.paused = false;
    }

    modify(milliseconds) {
        //this.timeLeft += milliseconds;
    }

    start() {
        //if(!this.paused) {
        //this.timeTurnStarted = Date.now();
        //}
    }

    stop() {
        //console.log('time started', this.timeTurnStarted);
        //if(!this.paused && this.timeTurnStarted > 0) {
        //const timeSinceStart = Date.now() - this.timeTurnStarted;
        //console.log('now ', Date.now());
        //console.log('started ', this.timeTurnStarted);
        //console.log('removing ', timeSinceStart, 'ms');
        //this.updateTimeLeft(timeSinceStart);
        //}
    }

    opponentStart() {
        //this.timeTurnStarted = Date.now();
    }

    timeRanOut() {
        return;
    }

    updateTimeLeft(milliseconds) {
        //if(this.timeLeft === 0 || milliseconds < 0) {
        //return;
        //}

        //if(this.mode === 'down') {
        //this.modify(-milliseconds);
        //if(this.timeLeft < 0) {
        //this.timeLeft = 0;
        //this.timeRanOut();
        //}
        //} else if(this.mode === 'up') {
        //this.modify(milliseconds);
        //}
    }

    getState() {
        return {
            mode: this.mode,
            timeLeft: this.timeLeft
        };
    }
}

module.exports = Clock;
