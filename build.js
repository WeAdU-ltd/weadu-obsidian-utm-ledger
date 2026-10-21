"use strict";
// Inline ./lib/<name> into a single main.js (Obsidian loads main.js only).
const fs=require("fs"),path=require("path");
const root=process.cwd();let src=fs.readFileSync(path.join(root,"src.main.js"),"utf8");
src=src.replace(/require\("\.\/lib\/(\w+)"\)/g,(m,n)=>{const lib=fs.readFileSync(path.join(root,"lib",n+".js"),"utf8");
return "(function(){var module={exports:{}};var exports=module.exports;\n"+lib+"\nreturn module.exports;})()";});
fs.writeFileSync(path.join(root,"main.js"),"/* Built by build.js from src.main.js and lib/. Do not edit. */\n"+src);
