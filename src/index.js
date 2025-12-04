import dotenv from 'dotenv'
dotenv.config()
import { createApp } from './app.js'

async function startServer() {
  try {
    const app = await createApp()
    const port = process.env.PORT || 4000

    app.listen(port, () => {
      console.log(`server running at ${port}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
  }
}

startServer()
