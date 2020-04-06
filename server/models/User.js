const Settings = require('../settings');

const champions = {
    Rodion: true,
    jfilipeg: true,
    Dorian11: true
};

class User {
    constructor(userData) {
        this.userData = userData;
        this.invalidDecks = undefined;
    }

    get _id() {
        return this.userData._id;
    }

    get disabled() {
        return this.userData.disabled;
    }

    get username() {
        return this.userData.username;
    }

    get tokens() {
        return this.userData.tokens;
    }

    get activationToken() {
        return this.userData.activationToken;
    }

    get activationTokenExpiry() {
        return this.userData.activationTokenExpiry;
    }

    get resetToken() {
        return this.userData.resetToken;
    }

    get tokenExpires() {
        return this.userData.tokenExpires;
    }

    get blockList() {
        return this.userData.blockList || [];
    }

    set blockList(value) {
        this.userData.blockList = value;
    }

    get password() {
        return this.userData.password;
    }

    get permissions() {
        return this.userData.permissions || [];
    }

    get email() {
        return this.userData.email;
    }

    get avatar() {
        return this.userData.avatar;
    }

    get verified() {
        return this.userData.verified;
    }

    get registered() {
        return this.userData.registered;
    }

    get isAdmin() {
        return this.userData.permissions && this.userData.permissions.isAdmin;
    }

    get isContributor() {
        return this.userData.permissions && this.userData.permissions.isContributor;
    }

    get isSupporter() {
        return this.userData.permissions && this.userData.permissions.isSupporter;
    }

    get isKiP() {
        return this.userData.permissions && this.userData.permissions.isKiP;
    }


    get role() {
        if(this.isAdmin) {
            return 'admin';
        }

        if(this.isContributor) {
            return 'contributor';
        }

        if(this.isSupporter) {
            return 'supporter';
        }

        if(this.isKiP) {
            return 'kip';
        }

        if(champions[this.username]) {
            return 'champion';
        }

        return 'user';
    }

    block(otherUser) {
        this.userData.blockList = this.userData.blockList || [];
        this.userData.blockList.push(otherUser.username.toLowerCase());
    }

    hasUserBlocked(otherUser) {
        return this.blockList.includes(otherUser.username.toLowerCase());
    }

    getWireSafeDetails() {
        let user = {
            _id: this.userData._id,
            username: this.userData.username,
            email: this.userData.email,
            settings: this.userData.settings,
            promptedActionWindows: this.userData.promptedActionWindows,
            permissions: this.userData.permissions,
            verified: this.userData.verified,
            avatar: this.userData.avatar
        };

        user = Settings.getUserWithDefaultsSet(user);

        return user;
    }

    getShortSummary() {
        return {
            username: this.username,
            name: this.username,
            role: this.role,
            avatar: this.userData.avatar
        };
    }

    getFullDetails() {
        let user = Object.assign({ invalidDecks: this.invalidDecks }, this.userData);

        delete user.password;

        user = Settings.getUserWithDefaultsSet(user);

        return user;
    }

    getDetails() {
        let user = Object.assign({ invalidDecks: this.invalidDecks }, this.userData);

        delete user.password;
        delete user.tokens;

        user = Settings.getUserWithDefaultsSet(user);
        user.role = this.role;

        return user;
    }
}

module.exports = User;
