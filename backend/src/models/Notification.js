import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    message: { // Content of the notification
        type: String,
        required: true,
    },
    type: { // Category of notification (e.g., 'APPREHENSION_UPLOAD')
        type: String,
        required: true,
    },
    referenceId: { // Optional: ID referring back to the ApprehendedVehicle document 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApprehendedVehicle',
    },
    isRead: { // Whether the notification has been seen by the user/admin
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
