module.exports = (events) => {
    let turns = 0;
    events.forEach(e => {
        if(e.message && e.message.alert && e.message.alert.type === 'endofround' && e.message.alert.message[0] && /End of turn/.test(e.message.alert.message[0])) {
            turns += 1;
        }
    });

    return turns;
};

