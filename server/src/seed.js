import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Profile from './models/Profile.js';
import Event from './models/Event.js';
import EventLog from './models/EventLog.js';

const seed = async () => {
  await connectDB();

  // Wipe everything
  await Profile.deleteMany({});
  await Event.deleteMany({});
  await EventLog.deleteMany({});
  console.log('Cleared all existing data (profiles, events, event logs)');

  // Create the single initial Admin account
  const admin = await Profile.create({
    name: 'Admin',
    timezone: 'UTC',
    role: 'Admin',
  });
  console.log(`Created initial Admin profile: ${admin.name} (${admin._id})`);

  console.log('Seed complete — clean state with one Admin.');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
