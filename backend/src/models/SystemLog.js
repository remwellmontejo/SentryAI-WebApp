import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    }
}, {
    timestamps: true
});

const SystemLog = mongoose.model('SystemLog', SystemLogSchema);
export default SystemLog;
