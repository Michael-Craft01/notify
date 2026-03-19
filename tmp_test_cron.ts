import { GET } from './src/app/api/send-deadline-alerts/route'

async function run() {
    console.log("Starting local test of cron route...")
    const req = {
        headers: {
            get: (key: string) => ''
        }
    } as any
    const res = await GET(req)
    console.log("Status:", res.status)
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
}
run()
