(async()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('profileForm'),alias=$('studentAlias'),status=$('profileStatus');
 form.hidden=true;
 let user;
 try{const response=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Service de connexion indisponible');
  user=(await response.json()).user;
  if(!user){location.replace('./connexion.html');return}
 }catch{status.textContent='Service de connexion indisponible. Réessaie plus tard.';return}
 alias.value=user.username;alias.readOnly=true;
 status.textContent='Session sécurisée : '+user.username+' ('+user.role+').';
 $('clearProfile').textContent='Me déconnecter';
 $('clearProfile').onclick=async()=>{
  try{const r=await fetch('/api/logout',{method:'POST',credentials:'same-origin'});if(!r.ok)throw Error('logout');location.replace('./connexion.html')}
  catch{status.textContent='Déconnexion impossible : réessaie.'}
 };
 $('passwordForm').onsubmit=async e=>{
  e.preventDefault();const output=$('passwordStatus');output.textContent='Mise à jour…';
  try{const r=await fetch('/api/password',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
   body:JSON.stringify({currentPassword:$('currentPassword').value,newPassword:$('newPassword').value})});
   const data=await r.json();output.textContent=data.notice||data.error||'Erreur';
   if(r.ok)location.replace('./connexion.html');
  }catch{output.textContent='Service indisponible.'}
 };
 try{const done=await window.CodeDuoSync.completed('code');
  $('boardCount').textContent=done.length+' / 14 chapitres validés '+(window.CodeDuoSync.isAuthenticated()?'sur ton compte':'sur cet appareil');
  $('boardProgress').style.width=(100*done.length/14)+'%';
 }catch{$('boardCount').textContent='Progression temporairement indisponible.';$('boardProgress').style.width='0%'}
})();