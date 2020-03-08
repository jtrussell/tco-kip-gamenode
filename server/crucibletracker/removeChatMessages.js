module.exports = (events) => {
    return events.filter(event => {
        return !(event.message && event.message[0] && event.message[0].argType === 'player');
    });
};
