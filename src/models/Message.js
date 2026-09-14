import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  senderId: { type: String, required: true },
  color: { type: String, default: '#00d4ff' },
  text: { type: String, required: true },
  isGif: { type: Boolean, default: false },
  replyTo: { type: Object, default: null },
  reactions: { type: Object, default: {} },
  time: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
