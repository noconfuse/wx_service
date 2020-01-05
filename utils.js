const formatString = function (str, ...rest) {
    return str.replace(/\$\{(\d+)\}/g,
        function (m, i) {
            return rest[i];
        });
}

module.exports = {
    formatString
}