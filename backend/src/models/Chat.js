import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    name: String,
    isGroup: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);
