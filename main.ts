const fs = require('fs');
const path = require('path');

interface DocsListProps {
  name: string;
  fullPath: string;
  modifyTimeMs: number;
  createTimeMs: number;
  modifyTime: string;
  createTime: string;
}

const docs = 'docs';

const getDocsList = ()=>{
  return fs.readdirSync(path.resolve(__dirname,docs)).map((p:string)=>{
    const stat = fs.statSync(path.resolve(__dirname, `${docs}/${p}`));
    return {
      name: p,
      fullPath: `${docs}/${p}`,
      modifyTimeMs:stat.mtimeMs,
      createTimeMs:stat.birthtimeMs,
      modifyTime: formatDate(stat.mtimeMs),
      createTime: formatDate(stat.birthtimeMs),
    }
  })
};

const docsList = getDocsList().sort((a:DocsListProps,b:DocsListProps)=>{a.createTimeMs - b.createTimeMs});

const genReadmeMd = ()=>{
  let readmeMd:string = '';
  docsList.forEach((item:DocsListProps)=>{
    readmeMd +=`- [${item.name}](${item.fullPath})\n\r`
  })
  return readmeMd;
};

const readmeMd:string = genReadmeMd();

const readme = fs.readFileSync(path.resolve(__dirname,'README.md'), 'utf8');

fs.writeFileSync(path.resolve(__dirname,'README.md'), `${readme.substring(0,readme.indexOf("## 目录") + 5)}\n\r${readmeMd}`)

function formatDate(time: number){
  return new Date(time + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
}



