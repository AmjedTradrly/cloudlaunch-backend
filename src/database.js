import mongoose from 'mongoose'

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('MONGODB_URI is not defined. Copy server/.env.example to server/.env and set your MongoDB connection string.')

  mongoose.connection.on('connected', () => console.log('Connected to MongoDB'))
  mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error.message))
  mongoose.connection.on('disconnected', () => console.log('Disconnected from MongoDB'))

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
}

export function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] || 'unknown'
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
