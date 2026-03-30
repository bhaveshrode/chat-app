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
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: 'sent'
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        reactions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                emoji: String
            }
        ],
        isEdited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({
    text: 'text'
});

export const Message = mongoose.model('Message', messageSchema);
