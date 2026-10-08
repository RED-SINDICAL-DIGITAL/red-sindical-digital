import {spawn} from 'node:child_process';
import readline from 'node:readline';
// Execute the exact Worker SQL against SQLite; D1 batch semantics are modeled transactionally.
export function sqliteD1(){
const process=spawn('python',['-u','-c',String.raw`
import sys,json,sqlite3
connection=sqlite3.connect(':memory:')
connection.row_factory=sqlite3.Row
def execute(statement):
 before=connection.total_changes
 cursor=connection.execute(statement['sql'],statement.get('args',[]))
 rows=[dict(row) for row in cursor.fetchall()] if cursor.description else []
 return {'results':rows,'meta':{'changes':connection.total_changes-before},'success':True}
for line in sys.stdin:
 try:
  item=json.loads(line)
  if 'batch' in item:
   connection.execute('BEGIN')
   result=[execute(s) for s in item['batch']]
  else: result=execute(item)
  connection.commit()
  print(json.dumps({'id':item['id'],'result':result}),flush=True)
 except Exception as e:
  connection.rollback()
  print(json.dumps({'id':item.get('id'),'error':str(e)}),flush=True)
`]);
let serial=0;const pending=new Map();const input=readline.createInterface({input:process.stdout});input.on('line',line=>{const r=JSON.parse(line),p=pending.get(r.id);pending.delete(r.id);if(r.error)p.reject(Error(r.error));else p.resolve(r.result)});
const send=x=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});process.stdin.write(JSON.stringify({id,...x})+'\n')});
const db={prepare(sql){return{sql,args:[],bind(...args){this.args=args;return this},run(){return send({sql:this.sql,args:this.args})},async first(){return(await this.run()).results[0]||null},all(){return this.run()}}},batch(statements){return send({batch:statements.map(s=>({sql:s.sql,args:s.args}))})},close(){process.stdin.end();input.close()}};return db;
}
