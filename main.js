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
var docsList = getDocsList().sort(function (a, b) { return -a.createTimeMs + b.createTimeMs; });
console.log('docsList:', docsList);
function BytesCount(str) {
    var cnt = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (/^[\u0000-\u00ff]$/.test(c)) {
            cnt++;
        }
        else {
            cnt += 2;
        }
    }
    return cnt;
}
var fillCatalogueName = function (name) {
    var str = "---------------------------------------------------------";
    return str.substring(BytesCount(name));
};
function ToCDB(str) {
    var tmp = "";
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) == 12288) {
            tmp += String.fromCharCode(str.charCodeAt(i) - 12256);
            continue;
        }
        if (str.charCodeAt(i) > 65280 && str.charCodeAt(i) < 65375) {
            tmp += String.fromCharCode(str.charCodeAt(i) - 65248);
        }
        else {
            tmp += String.fromCharCode(str.charCodeAt(i));
        }
    }
    return tmp;
}
var genReadmeMd = function () {
    var readmeMd = '';
    docsList.forEach(function (item) {
        readmeMd += "- [\u300A" + ToCDB(item.name) + "\u300B" + fillCatalogueName(ToCDB(item.name)) + " uptade " + item.createTime + "](" + item.fullPath + ")\n\r";
        // readmeMd +=`- [《${item.name}》————uptade ${item.createTime}](${item.fullPath})\n\r`
    });
    return readmeMd;
};
var readmeMd = genReadmeMd();
var readme = fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf8');
fs.writeFileSync(path.resolve(__dirname, 'README.md'), readme.substring(0, readme.indexOf("## 目录") + 5) + "\n\r" + readmeMd);
function formatDate(time) {
    return new Date(time + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}
