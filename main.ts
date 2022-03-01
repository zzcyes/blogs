const fs = require('fs');
const path = require('path');
import {getDocsList ,IFDocsItem,  genReadmeMd } from './utils/index';

const docsList = getDocsList(path.resolve(__dirname, 'docs')).sort((a:IFDocsItem, b:IFDocsItem) =>  -a.createTimeMs + b.createTimeMs);

const readmeMd = genReadmeMd(docsList);

console.log(readmeMd);

const readmeStr = fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf8');

fs.writeFileSync(path.resolve(__dirname, 'README.md'), readmeStr.substring(0, readmeStr.indexOf("## 目录") + 5) + "\n\r" + readmeMd);

console.log('Readme.md file was successfully created!');