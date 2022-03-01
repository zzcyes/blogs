const fs = require('fs');
const path = require('path');

const bytesCount = (str:string) => {
  var cnt = 0;
  for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (/^[\u0000-\u00ff]$/.test(c)) {
          cnt++;
      } else {
          cnt += 2;
      }
  }
  return cnt;
}

const fillCatalogueName = (name:string) => {
  return "---------------------------------------------------------".substring(bytesCount(name));
};

// 半角转为全角
const ToDBC = (str:string) => {
  var tmp = "";
  for (var i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) == 12288) {
          tmp += String.fromCharCode(str.charCodeAt(i) - 12256);
          continue;
      }
      if (str.charCodeAt(i) > 65280 && str.charCodeAt(i) < 65375) {
          tmp += String.fromCharCode(str.charCodeAt(i) - 65248);
      } else {
          tmp += String.fromCharCode(str.charCodeAt(i));
      }
  }
  return tmp;
}


const formatDate = (time:number) => {
  return new Date(time + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}


const getDocsList = (dir:string) =>{
  return fs.readdirSync(dir).map((p:string) =>{
      const stat = fs.statSync(path.resolve(__dirname, dir + "/" + p));
      return {
          name: p,
          fullPath: dir + "/" + p,
          modifyTimeMs: stat.mtimeMs,
          createTimeMs: stat.birthtimeMs,
          modifyTime: formatDate(stat.mtimeMs),
          createTime: formatDate(stat.birthtimeMs)
      }
  });
};


interface IFDocsItem {
  name: string;
  fullPath: string;
  modifyTimeMs: number;
  createTimeMs: number;
  modifyTime: string;
  createTime: string;
};

const genReadmeMd = (docsList:IFDocsItem[])=>{
  let readmeMd = '';
  docsList.forEach((item:IFDocsItem)=> {
      readmeMd += "- [\u300A" + ToDBC(item.name) + "\u300B" + fillCatalogueName(ToDBC(item.name)) + " uptade " + item.createTime + "](" + item.fullPath + ")\n\r";
      // readmeMd +=`- [《${item.name}》————uptade ${item.createTime}](${item.fullPath})\n\r`
  });
  return readmeMd;
};




export  {
  bytesCount,
  fillCatalogueName,
  ToDBC,
  formatDate,
  getDocsList,
  IFDocsItem,
  genReadmeMd
}