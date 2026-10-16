const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const readline = require('readline')

function ask(q){
  const rl = readline.createInterface({input: process.stdin, output: process.stdout})
  return new Promise(res=>rl.question(q, ans=>{rl.close(); res(ans)}))
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const sock = makeWASocket({
    auth: state,
    logger: P({level:'silent'}),
    printQRInTerminal: false,
    browser: ["Ubuntu","Chrome","22.04"]
  })
  sock.ev.on('creds.update', saveCreds)

  if(!sock.authState.creds.registered){
    let nomor = await ask('Masukin nomor WA lu (628xxxx): ')
    nomor = nomor.replace(/[^0-9]/g,'')
    console.log('Minta kode...')
    await new Promise(r=>setTimeout(r, 2000))
    const code = await sock.requestPairingCode(nomor)
    console.log(`\n\n==== KODE LU: ${code} ====\nMasukin di WA sekarang! Jangan CTRL+C!\n\n`)
  }

  sock.ev.on('connection.update', ({connection})=>{
    if(connection==='open') console.log("✅ BOT EGI UDAH KONEK!")
    if(connection==='close') console.log("Koneksi ketutup, coba node index.js lagi")
  })
}
start()
