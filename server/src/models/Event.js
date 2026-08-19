import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    profiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
      },
    ],
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date/time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date/time is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Creator profile is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Validate that at least one profile is assigned
eventSchema.path('profiles').validate(function (value) {
  return value && value.length > 0;
}, 'At least one profile must be assigned');

// Validate end > start
eventSchema.pre('validate', function (next) {
  if (this.startDateTime && this.endDateTime) {
    if (this.endDateTime <= this.startDateTime) {
      this.invalidate('endDateTime', 'End date/time must be after start date/time');
    }
  }
  next();
});

eventSchema.index({ profiles: 1 });
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ createdBy: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
