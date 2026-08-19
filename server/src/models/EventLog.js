import mongoose from 'mongoose';

const changeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    updatedValue: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const eventLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    changes: [changeSchema],
  },
  {
    timestamps: true,
  }
);

const EventLog = mongoose.model('EventLog', eventLogSchema);

export default EventLog;
