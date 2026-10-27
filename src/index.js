import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { connectDatabase, databaseStatus, disconnectDatabase } from './database.js'
import { User } from './models/User.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'classroom-demo-secret-change-in-production'
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Origin is not allowed by CORS.'))
  },
}))
app.use(express.json({ limit: '10kb' }))

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const issueToken = (user) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' })

app.get('/api', (_req, res) => res.json({ name: 'CloudLaunch API', version: '1.0.0' }))
app.get('/api/health', (_req, res) => {
  const database = databaseStatus()
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'online' : 'degraded',
    service: 'cloudlaunch-api', database, region: process.env.AWS_REGION || 'local',
  })
})

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name.' })
    if (!emailPattern.test(email)) return res.status(400).json({ message: 'Please enter a valid email.' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' })
    const existingUser = await User.exists({ email })
    if (existingUser) return res.status(409).json({ message: 'An account with this email already exists.' })
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) })
    res.status(201).json({ token: issueToken(user), user: user.toJSON() })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' })
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Could not create account.' })
  }
})

app.post('/api/auth/signin', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    res.json({ token: issueToken(user), user: user.toJSON() })
  } catch (error) {
    console.error('Signin error:', error)
    res.status(500).json({ message: 'Could not sign in.' })
  }
})

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }))
app.use((error, _req, res, _next) => {
  if (error.message === 'Origin is not allowed by CORS.') return res.status(403).json({ message: error.message })
  console.error('Unhandled API error:', error)
  res.status(500).json({ message: 'Internal server error.' })
})

let server
async function startServer() {
  try {
    await connectDatabase()
    server = app.listen(PORT, () => console.log(`CloudLaunch API running at http://localhost:${PORT}`))
  } catch (error) {
    console.error('Failed to start CloudLaunch API:', error.message)
    process.exit(1)
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`)
  if (server) await new Promise((resolve) => server.close(resolve))
  await disconnectDatabase()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
startServer()
