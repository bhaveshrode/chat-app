import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: String,
        fileUrl: String,
        fileType: String,
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: 'sent'
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true
    }
);

messageSchema.index({
    text: 'text'
});

export const Message = mongoose.model('Message', messageSchema);
