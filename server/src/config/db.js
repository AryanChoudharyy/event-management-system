import mongoose from 'mongoose';
import dns from 'dns';

const configureDns = () => {
  const servers = process.env.MONGODB_DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers?.length) {
    dns.setServers(servers);
  }
};

const connectDB = async () => {
  try {
    configureDns();

    let uri = process.env.MONGODB_URI;

    // If no external MongoDB URI or using default localhost that may not be running,
    // fall back to in-memory MongoDB for development
    if (!uri || uri === 'your_mongodb_connection_string' || uri === 'mongodb://localhost:27017/eventflow') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('Using in-memory MongoDB for development');
      } catch {
        // mongodb-memory-server not installed, try the URI as-is
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
