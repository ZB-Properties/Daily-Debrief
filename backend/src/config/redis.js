const redis = require('redis');
const winston = require('winston');

let redisClient;
let pubClient;
let subClient;

const connectRedis = async () => {
  try {
    // Create Redis clients
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://default:hlPzUO80DSgFJzmriJl2YB4d1vXH0pu1@redis-11589.c240.us-east-1-3.ec2.cloud.redislabs.com:11589'
    });

    pubClient = redisClient.duplicate();
    subClient = redisClient.duplicate();

    // Connect all clients
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect()
    ]);

    console.log('✅ Redis connected');

    // Handle connection events
    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis connected');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting');
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis connection closed');
    });

  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

const getRedisClient = () => redisClient;
const getPubClient = () => pubClient;
const getSubClient = () => subClient;

module.exports = {
  connectRedis,
  getRedisClient,
  getPubClient,
  getSubClient
};