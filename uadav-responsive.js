(()=>{
'use strict';
if(!['admin','mi-espacio-artista'].includes(document.body?.dataset.page))return;
function labelTable(table){const headings=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());if(!headings.length)return;table.dataset.mobileTable='true';table.querySelectorAll('tbody tr').forEach(row=>{if([...row.children].some(c=>c.colSpan>1))return;[...row.children].forEach((cell,i)=>{if(cell.tagName==='TD')cell.dataset.label=headings[i]||''})})}
function scan(root){if(root.matches?.('table'))labelTable(root);root.querySelectorAll?.('table').forEach(labelTable)}
scan(document.body);new MutationObserver(changes=>changes.forEach(change=>{const table=change.target.closest?.('table');if(table)labelTable(table);change.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)})})).observe(document.body,{childList:true,subtree:true});
const menu=document.getElementById('mobileMenu'),sidebar=document.querySelector('.sidebar');if(menu&&sidebar){menu.setAttribute('aria-label','Menú de administración');const sync=()=>menu.setAttribute('aria-expanded',String(sidebar.classList.contains('open')));sync();new MutationObserver(sync).observe(sidebar,{attributes:true,attributeFilter:['class']})}
})();
