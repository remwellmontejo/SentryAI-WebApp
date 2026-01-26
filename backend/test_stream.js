// test_stream.js
import WebSocket from 'ws';

// Connect to your REAL backend as if we are the Camera
const ws = new WebSocket('wss://sentryai.onrender.com?type=camera&serial=SN-001');

// A tiny valid JPEG (Red Pixel) - 600 bytes
const fakeImageBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNCRQUFQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQX/wAARCAABAAEDAREAAhEBAxEB/8QADAAAAAACAAAAAAAB/8QAGwEAAwEBAQEAAAAAAAAAAAAAAAIEAwUABv/EACgQAAICAgICAgICAgMAAAAAAAABAgMEESEFMRJBE1EiYXGBkTKh8P/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAZEQEBAQEBAQAAAAAAAAAAAAAAARECEgP/2gAMAwEAAhEDEQA/AfX52dln/9k=";
const fakeImageBuffer = Buffer.from(fakeImageBase64, 'base64');

ws.on('open', function open() {
    console.log('✅ Connected to Render! Starting Stream simulation...');

    // Send a frame every 100ms (10 FPS)
    setInterval(() => {
        ws.send(fakeImageBuffer);
        process.stdout.write('.');
    }, 100);
});

ws.on('error', console.error);
ws.on('close', () => console.log('Disconnected'));