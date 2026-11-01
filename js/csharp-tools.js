/* Diagnostics pédagogiques C# : ne remplace pas Roslyn. */
(function(root){
  'use strict';
  function analyze(source){
    const findings=[],stack=[];let line=1,col=0,state='code';
    const open={'{':'}','(':')','[':']'},close={'}':'{',')':'(',']':'['};
    const add=(severity,message,at)=>findings.push({severity,message,line:at||line});
    for(let i=0;i<source.length;i++){
      const c=source[i],n=source[i+1];col++;
      if(c==='\n'){line++;col=0;if(state==='comment')state='code';continue}
      if(state==='comment')continue;
      if(state==='block'){if(c==='*'&&n==='/'){state='code';i++;}continue}
      if(state==='string'){if(c==='\\'){i++;continue}if(c==='"')state='code';continue}
      if(state==='char'){if(c==='\\'){i++;continue}if(c==="'")state='code';continue}
      if(c==='/'&&n==='/'){state='comment';i++;continue}
      if(c==='/'&&n==='*'){state='block';i++;continue}
      if(c==='@'&&n==='"'){state='verbatim';i++;continue}
      if(state==='verbatim'){if(c==='"'){if(n==='"')i++;else state='code'}continue}
      if(c==='"'){state='string';continue}
      if(c==="'"){state='char';continue}
      if(open[c])stack.push({char:c,line});
      else if(close[c]){const last=stack.pop();if(!last||last.char!==close[c]){add('error','Délimiteur inattendu : '+c);if(last)stack.push(last)}}
    }
    if(state==='string'||state==='char'||state==='verbatim')add('error','Chaîne ou caractère non terminé');
    if(state==='block')add('error','Commentaire de bloc non terminé');
    for(const s of stack.slice(-10))add('error','Délimiteur « '+s.char+' » non fermé',s.line);
    if(/\b(UnityEngine|MonoBehaviour|Debug\.Log|GameObject)\b/.test(source))add('info','Ce programme utilise Unity : il nécessite le moteur Unity et ne peut pas s’exécuter tel quel dans une console .NET.');
    if(/\bConsole\.Write(Line)?\s*\(/.test(source) && !/\busing\s+System\s*;/.test(source) && !/\bSystem\.Console\./.test(source))add('info','Vérifie que System est accessible (using System; ou implicit usings).');
    if(source.length>20000)add('warning','Fichier volumineux : l’analyse rapide reste limitée.');
    return findings;
  }
  root.CodeDuoCSharp={analyze};
})(typeof window!=='undefined'?window:globalThis);
