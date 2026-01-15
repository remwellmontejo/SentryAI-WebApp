import Camera from '../models/Camera.js';

const getCameras = async (req, res) => {
    try {
        const cameras = await Camera.find();
        res.json(cameras);
    } catch (e) { res.status(500).send(e.message); }
};

const getCameraDetails = async (req, res) => {
    try {
        const camera = await Camera.findOne({ serialNumber: req.params.serialNumber });
        if (!camera) return res.status(404).send("Camera not found");
        res.json(camera);
    } catch (e) { res.status(500).send(e.message); }
};

export { getCameras, getCameraDetails };