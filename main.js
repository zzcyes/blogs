var fs = require('fs');
var path = require('path');
var docs = 'docs';
var getDocsList = function () {
    return fs.readdirSync(path.resolve(__dirname, docs)).map(function (p) {
        var stat = fs.statSync(path.resolve(__dirname, docs + "/" + p));
        return {
            name: p,
            fullPath: docs + "/" + p,
            modifyTimeMs: stat.mtimeMs,
            createTimeMs: stat.birthtimeMs,
            modifyTime: formatDate(stat.mtimeMs),
            createTime: formatDate(stat.birthtimeMs)
        };
    });
};
var docsList = getDocsList().sort(function (a, b) { a.createTimeMs - b.createTimeMs; });
var genReadmeMd = function () {
    var readmeMd = '';
    docsList.forEach(function (item) {
        readmeMd += "- [" + item.name + "](" + item.fullPath + ")\n\r";
    });
    return readmeMd;
};
var readmeMd = genReadmeMd();
var readme = fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf8');
fs.writeFileSync(path.resolve(__dirname, 'README.md'), readme.substring(0, readme.indexOf("## 目录") + 5) + "\n\r" + readmeMd);
function formatDate(time) {
    return new Date(time + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}
