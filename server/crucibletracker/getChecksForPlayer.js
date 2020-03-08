module.exports = (player, events) => {
    let checks = 0;
    events.forEach(e => {
        if(e.message && e.message.alert && e.message.alert.message && e.message.alert.message[0] && e.message.alert.message[0].name === player && / declares Check!/.test(e.message.alert.message[1])) {
            checks += 1;
        }
    });

    return checks;
};
