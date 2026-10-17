const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    console.log(`Using WA v${version.join('.')}`)
    
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        logger: P({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false
    })

    sock.ev.on('creds.update', saveCreds)

    if (!sock.authState.creds.registered) {
        await new Promise(r => setTimeout(r, 3000))
        const nomor = await question('NOMOR BOT 62xxxx: ')
        const cleanNum = nomor.replace(/[^0-9]/g, '')
        try {
            const code = await sock.requestPairingCode(cleanNum)
            console.log(`\nKODE LU: ${code}\n`)
            console.log('Buka WA > Perangkat Tertaut > Tautkan dengan nomor telepon')
        } catch (e) {
            console.log('Gagal minta kode:', e.message)
            console.log('Coba lagi, atau ganti nomor/IP')
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            console.log('BOT CONNECTED BOS!')
            rl.close()
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) start()
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(m.key.remoteJid, { text: 'pong 🗿' })
        }
    })
}

start()
