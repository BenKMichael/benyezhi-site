module.exports = {
    // Must match auth's config/constants.js exactly -- both services read
    // the same cookie, issued by auth, validated here.
    SESSION_COOKIE_NAME: 'analytics_sid',
    ROLES: {
        ADMIN: 0xFFFF,  // 65535
        BASIC: 1        // 1
    }
};
