import { pathToFileURL } from 'url'
import type { Request } from 'firebase-functions/v2/https'
import type { Response } from 'express'

const kitPromise = import(`${pathToFileURL(process.cwd())}/index.js`)
const manifestPromise = import(`${pathToFileURL(process.cwd())}/manifest.js`)

export const handle = async (req: Request, res: Response) => {
  // TODO cache setup?
  const { Server } = await kitPromise
  const { manifest } = await manifestPromise
  const server = new Server(manifest)
  await server.init({ env: process.env })

  // TODO translate Firebase request into Web Standard Request
  const rendered = server.respond(req)
  const body = await rendered.text()
  return res
    .writeHead(rendered.status, Object.fromEntries(rendered.headers))
    .end(body)
}
