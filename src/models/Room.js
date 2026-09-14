import mongoose from 'mongoose';

const SnapshotSchema = new mongoose.Schema({
  id: String,
  timestamp: String,
  filename: String,
  code: String,
  author: String,
  note: String
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  files: { type: Object, default: {} },
  code: { type: String, default: '' },
  password: { type: String, default: null },
  theme: { type: String, default: 'dracula' },
  snapshots: { type: [SnapshotSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
