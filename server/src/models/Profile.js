import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'User'],
      default: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

profileSchema.index({ name: 1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
