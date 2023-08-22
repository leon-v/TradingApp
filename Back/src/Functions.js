global.usFirst = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

global.strToBool = function (string) {
    switch (string.toLowerCase()) {
        case "1":
        case "true":
            return true;
    }

    return false;
}