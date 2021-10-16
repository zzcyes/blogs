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

const docsList = getDocsList().sort((a:DocsListProps,b:DocsListProps)=> - a.createTimeMs + b.createTimeMs);

console.log('docsList:',docsList);


function BytesCount(str:string){
  var cnt = 0;
  for(var i=0; i<str.length; i++){
    var c = str.charAt(i);
    if(/^[\u0000-\u00ff]$/.test(c)){
      cnt++;
    }else{
      cnt+=2;
    }
  }
  return cnt;
}

const fillCatalogueName = (name:string)=>{
  let str = "---------------------------------------------------------";
  return str.substring(BytesCount(name))
}

function ToCDB(str:string) { 
  var tmp = ""; 
  for(var i=0;i<str.length;i++){ 
      if (str.charCodeAt(i) == 12288){
          tmp += String.fromCharCode(str.charCodeAt(i)-12256);
          continue;
      }
      if(str.charCodeAt(i) > 65280 && str.charCodeAt(i) < 65375){ 
          tmp += String.fromCharCode(str.charCodeAt(i)-65248); 
      } 
      else{ 
          tmp += String.fromCharCode(str.charCodeAt(i)); 
      } 
  } 
  return tmp 
} 


const genReadmeMd = ()=>{
  let readmeMd:string = '';
  docsList.forEach((item:DocsListProps)=>{

    readmeMd +=`- [《${ToCDB(item.name)}》${fillCatalogueName(ToCDB(item.name))} uptade ${item.createTime}](${item.fullPath})\n\r`
    // readmeMd +=`- [《${item.name}》————uptade ${item.createTime}](${item.fullPath})\n\r`
  })
  return readmeMd;
};

const readmeMd:string = genReadmeMd();

const readme = fs.readFileSync(path.resolve(__dirname,'README.md'), 'utf8');

fs.writeFileSync(path.resolve(__dirname,'README.md'), `${readme.substring(0,readme.indexOf("## 目录") + 5)}\n\r${readmeMd}`)

function formatDate(time: number){
  return new Date(time + 28800000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
}



