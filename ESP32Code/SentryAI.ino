#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <ESP32Servo.h>
#include <Seeed_Arduino_SSCMA.h> 
#include <HTTPClient.h>          
#include <Arduino_JSON.h>        
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h> // Library: "WebSockets" by Markus Sattler
#include <WiFiManager.h>
#include "Arducam_Mega.h"

//constants
#define PRODUCT_SERIAL_NUMBER "SN-001"
#define WIFI_TIMEOUT_MS 20000
#define API_APPREHENSION "https://sentryai.onrender.com/api/apprehended-vehicle/create"
#define SSCMA_CONNECT_TO_XIAO_S3 1
#define SSCMA_CONNECT_TO_GORVE_VISION_AI 0
#define CS_PIN 1
#define SERVO_PIN_PAN 2    // Pan Servo Pin
#define SERVO_PIN_TILT 3   // Tilt Servo Pin

#define AI_VIRTUAL_CANVAS 240.0 
#define ALIGN_SCALE 0.9
#define ALIGN_OFFSET_X 5
#define ALIGN_OFFSET_Y 5

// --- NEW THRESHOLDS ---
#define MIN_HIT_STREAK 3         // Must be seen in 3 consecutive frames to be "real"
#define GHOST_TIMEOUT 500        // If an unstable object vanishes for 0.5s, kill it instantly

//ai inference config
#define MAX_TRACKED_OBJECTS 5
#define TIMEOUT_THRESHOLD 3000 
#define DISTANCE_THRESHOLD 90
#define NMS_DISTANCE_THRESHOLD 60
uint16_t apprehensionTimer = 10; //change name later
CAM_VIDEO_MODE streamResolution = CAM_VIDEO_MODE_4; 
CAM_IMAGE_MODE HIGH_RES_MODE = CAM_IMAGE_MODE_UXGA; // For Apprehension
CAM_IMAGE_PIX_FMT format = CAM_IMAGE_PIX_FMT_JPG;
CAM_VIDEO_MODE STREAM_RES_MODE = CAM_VIDEO_MODE_4;

//websocket config
#define WS_HOST "sentryai.onrender.com"
#define WS_PORT 443
const char* WS_PATH = "/?type=camera&serial=" PRODUCT_SERIAL_NUMBER;

//objects and globals
WebSocketsClient webSocket;
SSCMA AI;
bool isConnected = false;
Arducam_Mega myCAM(CS_PIN);
WiFiClientSecure client; // Shared client for uploads
Servo panServo;
Servo tiltServo;

int currentPan = 90;
int currentTilt = 90;

unsigned long lastServoMoveTime = 0;
bool isServoMoving = false;

const size_t MAX_IMAGE_SIZE = 200000; 
uint8_t* chunkBuffer = NULL;    // Buffer to reconstruct the image
size_t currentLen = 0;          // How many bytes we have collected so far
bool isReceiving = false;
bool configReceived = false;     // Flag to track if we are inside a frame
volatile int pendingUploadStatus = 0; // 0=Idle, 1=Capturing, 2=Complete, 3=Failed

struct TrackedObject {
  int id;
  int target; // 1=Car, 2=Motorcycle
  int x;
  int y;
  int score;
  unsigned long startTime;       // Time object was first detected by AI
  unsigned long lastSeenTime;    // Time object was last seen
  unsigned long firstInZoneTime;
  bool isActive;
  bool hasTriggeredCapture; 

  int hitStreak;   // Counts how many consecutive frames we've seen it
  bool isStable;  // Becomes true once hitStreak reaches our threshold
};

TaskHandle_t FOMOTaskHandle;
TaskHandle_t UploadTaskHandle;
SemaphoreHandle_t cameraMutex;  // CRITICAL: Protects SPI Bus
QueueHandle_t uploadQueue;

struct Point { int x; int y; };

// ================= CONFIGURATION STRUCT =================
// Holds settings synced from Database
struct CameraConfig {
    bool streamEnabled = true;     
    int streamResolution = 1;      
    int apprehensionTimer = 15; 
    int numZones = 0;               // 0-3 active zones
    bool zoneEnabled[3] = {false, false, false};
    int polyX[3][6] = {{0},{0},{0}};
    int polyY[3][6] = {{0},{0},{0}};
    int servoPan = 90;
    int servoTilt = 90;
};
CameraConfig config; 
unsigned long lastHeartbeatTime = 0;

// Data packet for the Upload Queue
struct UploadRequest {
    int id;
    int target;
    int score;
    int x;
    int y;
};

TrackedObject trackedObjects[MAX_TRACKED_OBJECTS];
uint32_t nextTrackID = 1;

void applyServoSettings() {
    int targetPan = constrain(config.servoPan, 0, 180);
    int targetTilt = constrain(config.servoTilt, 90, 130);

    // 1. Check if we have successfully arrived at the target
    if (currentPan == targetPan && currentTilt == targetTilt) {
        if (isServoMoving) {
            // We arrived! Instantly unlock the UI. No cooldown.
            webSocket.sendTXT("{\"type\":\"servo_moving\", \"status\":false}");
            isServoMoving = false;
            Serial.println("[Servo] Target reached. UI Unlocked.");
        }
        return; // Exit immediately
    }

    // 2. SPEED GOVERNOR (Non-Blocking Delay)
    // This dictates how fast the servo takes its next step. 
    // 20ms means it updates 50 times per second, perfectly smooth!
    unsigned long now = millis();
    if (now - lastServoMoveTime < 10) return; 
    lastServoMoveTime = now;

    // 3. Lock UI when starting the journey
    if (!isServoMoving) {
        isServoMoving = true;
        webSocket.sendTXT("{\"type\":\"servo_moving\", \"status\":true}");
        Serial.printf("[Servo] Panning to %d, Tilting to %d...\n", targetPan, targetTilt);
    }

    // 4. Take a tiny, smooth step toward the targets
    int STEP_SIZE = 5; // Move 2 degrees per frame.
    
    // --- PAN STEP ---
    if (currentPan != targetPan) {
        if (abs(targetPan - currentPan) <= STEP_SIZE) {
            currentPan = targetPan; // Snap to target if we are really close
        } else if (targetPan > currentPan) {
            currentPan += STEP_SIZE;
        } else {
            currentPan -= STEP_SIZE;
        }
        panServo.write(currentPan);
    }

    // --- TILT STEP ---
    if (currentTilt != targetTilt) {
        if (abs(targetTilt - currentTilt) <= STEP_SIZE) {
            currentTilt = targetTilt; // Snap to target if we are really close
        } else if (targetTilt > currentTilt) {
            currentTilt += STEP_SIZE;
        } else {
            currentTilt -= STEP_SIZE;
        }
        tiltServo.write(currentTilt);
    }
}

CAM_VIDEO_MODE getCamMode(int resIndex) {
    switch (resIndex) {
        case 0: return CAM_VIDEO_MODE_3; 
        case 1: return CAM_VIDEO_MODE_5;  
        default: return CAM_VIDEO_MODE_3; 
    }
}

Point mapAiToPercentage(int ai_x, int ai_y) {
    // 1. Apply physical camera alignment (Scaling & Offsets)
    float aligned_x = (ai_x * ALIGN_SCALE) + ALIGN_OFFSET_X;
    float aligned_y = (ai_y * ALIGN_SCALE) + ALIGN_OFFSET_Y;

    // 2. Convert to a Percentage (0 to 100)
    int pct_x = (aligned_x / AI_VIRTUAL_CANVAS) * 100.0;
    int pct_y = (aligned_y / AI_VIRTUAL_CANVAS) * 100.0;

    // 3. Clamp safely between 0% and 100%
    if (pct_x < 0) pct_x = 0;
    if (pct_x > 100) pct_x = 100;
    if (pct_y < 0) pct_y = 0;
    if (pct_y > 100) pct_y = 100;

    return {pct_x, pct_y};
}

// Check if point (pct_x, pct_y) is inside ANY enabled Zone Polygon (0-100 space)
bool isInsideZone(int pct_x, int pct_y) {
    if (config.numZones == 0) return true; // No zones = everywhere valid

    for (int z = 0; z < config.numZones; z++) {
        if (!config.zoneEnabled[z]) continue;

        bool collision = false;
        for (int current = 0; current < 6; current++) {
            int next = (current + 1) % 6;
            float vc_x = config.polyX[z][current];
            float vc_y = config.polyY[z][current];
            float vn_x = config.polyX[z][next];
            float vn_y = config.polyY[z][next];

            if (((vc_y >= pct_y && vn_y < pct_y) || (vc_y < pct_y && vn_y >= pct_y)) &&
                (pct_x < (vn_x - vc_x) * (pct_y - vc_y) / (vn_y - vc_y) + vc_x)) {
                collision = !collision;
            }
        }
        if (collision) return true; // Inside at least one zone
    }
    return false; // Not inside any enabled zone
}

void stop_preview() {
    Serial.println("--- Stream Stopped ---");
    isReceiving = false;
    currentLen = 0;
}

// ---------------------------------------------------------
// STREAMING CALLBACK (Reconstructs Image for WebSocket)
// ---------------------------------------------------------
uint8_t readBuffer(uint8_t* imagebuf, uint8_t length) {
    if (!isConnected || chunkBuffer == NULL) return 1;

    if (imagebuf[0] == 0xff && imagebuf[1] == 0xd8) {
        isReceiving = true;
        currentLen = 0;
    }
    if (isReceiving) {
        if (currentLen + length < MAX_IMAGE_SIZE) {
            memcpy(chunkBuffer + currentLen, imagebuf, length);
            currentLen += length;
        } else {
            isReceiving = false;
            currentLen = 0;
            return 1; 
        }
    }
    if (currentLen == myCAM.getTotalLength()) {
        webSocket.sendBIN(chunkBuffer, currentLen);
        isReceiving = false; 
        currentLen = 0;
    }
    return 1;
}

// ---------------------------------------------------------
// WEBSOCKET EVENTS
// ---------------------------------------------------------
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("❌ Disconnected");
            isConnected = false;
            if(xSemaphoreTake(cameraMutex, portMAX_DELAY)) {
                myCAM.stopPreview(); 
                xSemaphoreGive(cameraMutex);
            }
            break;
            
        case WStype_CONNECTED:
            Serial.println("✅ Connected to Render!");
            isConnected = true;

            webSocket.sendTXT("{\"type\":\"heartbeat\"}");

            // --- CHANGED: Only start preview if stream is enabled ---
            if (config.streamEnabled) {
                Serial.println("Starting Preview...");
                if(xSemaphoreTake(cameraMutex, portMAX_DELAY)) {
                    myCAM.startPreview(getCamMode(config.streamResolution));
                    xSemaphoreGive(cameraMutex);
                }
            } else {
                Serial.println("Stream is disabled in config. Not starting preview.");
            }
            break; 
        
        case WStype_TEXT:
            // 🚀 RECEIVE CONFIG FROM BACKEND
            Serial.printf("[WS] Config: %s\n", payload);
            
            JSONVar json = JSON.parse((char*)payload);
            
            if (JSON.typeof(json) != "undefined") {
                // Map JSON -> C++ Struct
                if (json.hasOwnProperty("streamEnabled")) {
                    bool newStreamState = (bool)json["streamEnabled"];
                    
                    // Did the state change?
                    if (newStreamState != config.streamEnabled) {
                        config.streamEnabled = newStreamState;
                        
                        if(xSemaphoreTake(cameraMutex, portMAX_DELAY)) {
                            if (config.streamEnabled) {
                                Serial.println("[Config] Stream Enabled -> Starting camera");
                                myCAM.startPreview(getCamMode(config.streamResolution));
                            } else {
                                Serial.println("[Config] Stream Disabled -> Stopping camera");
                                myCAM.stopPreview();
                            }
                            xSemaphoreGive(cameraMutex);
                        }
                    }
                }

                if (json.hasOwnProperty("apprehensionTimer")) config.apprehensionTimer = (int)json["apprehensionTimer"];
                
                if (json.hasOwnProperty("streamResolution")) {
                    int newRes = (int)json["streamResolution"];
                    
                    // Only restart stream if the resolution ACTUALLY changed
                    if (newRes != config.streamResolution) {
                        
                        Serial.printf("[Config] Changing Resolution to Index: %d\n", newRes);
                        
                        // RESTART STREAM WITH NEW RESOLUTION
                        if (isConnected && config.streamEnabled) {
                            if(xSemaphoreTake(cameraMutex, portMAX_DELAY)) {
                                myCAM.stopPreview();
                                delay(50); // Small pause for hardware
                                myCAM.startPreview(getCamMode(newRes)); 
                                xSemaphoreGive(cameraMutex);
                            }
                        }
                        config.streamResolution = newRes;
                    }
                }

                // Servos
                if (json.hasOwnProperty("servoPan")) config.servoPan = (int)json["servoPan"];
                if (json.hasOwnProperty("servoTilt")) config.servoTilt = (int)json["servoTilt"];
                
                // Zones Array (up to 3 zones, each with 6-point polygon)
                if (json.hasOwnProperty("zones")) {
                    int numZones = json["zones"].length();
                    if (numZones > 3) numZones = 3;
                    config.numZones = numZones;
                    for (int z = 0; z < numZones; z++) {
                        config.zoneEnabled[z] = (bool)json["zones"][z]["enabled"];
                        for (int i = 0; i < 6; i++) {
                            config.polyX[z][i] = (int)json["zones"][z]["polyX"][i];
                            config.polyY[z][i] = (int)json["zones"][z]["polyY"][i];
                        }
                    }
                    // Clear any extra zones beyond what was received
                    for (int z = numZones; z < 3; z++) {
                        config.zoneEnabled[z] = false;
                    }
                }

                // Move Servos & Update State
                //applyServoSettings(); 
                
                // Unblock Setup()
                configReceived = true;
            }
            break;
    }
}

void keepWifiAlive(void * params) {
  while(true) {
    if(WiFi.status() == WL_CONNECTED) {
      Serial.println("[WIFI] Wifi connected.");
      vTaskDelay(10000 /  portTICK_PERIOD_MS);
      continue;
    }

    Serial.println("Wifi recconnecting...");
    WiFi.reconnect();

    unsigned long startAttemptTime = millis();

    while(WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < WIFI_TIMEOUT_MS) {}
    
    if (WiFi.status() != WL_CONNECTED){
      Serial.println("[WIFI] Failed to connect.");
      vTaskDelay(20000 / portTICK_PERIOD_MS);
      continue;
    }

    Serial.println("[WIFI] Connected: " + WiFi.localIP().toString());
  }
}

void FOMOTask(void * params) {
  Serial.print("AI Task running on Core: ");
  Serial.println(xPortGetCoreID()); // Should print '1'

  // PRE-CALCULATE SQUARED THRESHOLDS FOR CPU OPTIMIZATION (No sqrt needed)
  const float NMS_SQ = NMS_DISTANCE_THRESHOLD * NMS_DISTANCE_THRESHOLD;
  const float DIST_SQ = DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;

  for(;;) { // Infinite Loop (Replacment for void loop)
    unsigned long currentTime = millis();

    // 1. RUN INFERENCE
    if (!AI.invoke(1, 1, 0)) {
      
      auto detections = AI.boxes();
      int numDetections = detections.size();

      std::vector<bool> isValid(numDetections, true);
      std::vector<bool> isMatched(numDetections, false);

      // =========================================================
      // 1.5 CLUSTERING / NMS PASS (NEW OPTIMIZATION)
      // Merge clumped centroids before doing any tracking logic
      // =========================================================
      for (int i = 0; i < numDetections; i++) {
        if (!isValid[i]) continue;

        int clusterCount = 1;
        long sumX = detections[i].x;
        long sumY = detections[i].y;
        int maxScore = detections[i].score;

        for (int j = i + 1; j < numDetections; j++) {
          if (!isValid[j]) continue;

          if (detections[i].target == detections[j].target) {
            float dx = detections[i].x - detections[j].x;
            float dy = detections[i].y - detections[j].y;
            float distSq = (dx * dx) + (dy * dy); // Use squared distance

            if (distSq < NMS_SQ) {
              isValid[j] = false; // Mark as absorbed
              sumX += detections[j].x;
              sumY += detections[j].y;
              clusterCount++;
              if (detections[j].score > maxScore) {
                maxScore = detections[j].score;
              }
            }
          }
        }
        
        // Average the merged coordinates to get a stable, central point
        if (clusterCount > 1) {
          detections[i].x = sumX / clusterCount;
          detections[i].y = sumY / clusterCount;
          detections[i].score = maxScore;
        }
      }

      // =========================================================
      // 2. MATCHING PASS (Optimized)
      // =========================================================
      for (int i = 0; i < MAX_TRACKED_OBJECTS; i++) {
        if (trackedObjects[i].isActive) {
          int bestMatch = -1;
          float minDstSq = DIST_SQ;

          for (int j = 0; j < numDetections; j++) {
            // Only look at valid (un-absorbed) and unmatched detections
            if (isValid[j] && !isMatched[j] && detections[j].target == trackedObjects[i].target) {
              float dx = detections[j].x - trackedObjects[i].x;
              float dy = detections[j].y - trackedObjects[i].y;
              float dstSq = (dx * dx) + (dy * dy);
              
              if (dstSq < minDstSq) {
                minDstSq = dstSq;
                bestMatch = j;
              }
            }
          }

          if (bestMatch != -1) {
            trackedObjects[i].x = detections[bestMatch].x;
            trackedObjects[i].y = detections[bestMatch].y;
            trackedObjects[i].score = detections[bestMatch].score;
            trackedObjects[i].lastSeenTime = currentTime;
            isMatched[bestMatch] = true;

            if (!trackedObjects[i].isStable) {
                trackedObjects[i].hitStreak++;
                if (trackedObjects[i].hitStreak >= MIN_HIT_STREAK) {
                    trackedObjects[i].isStable = true;
                    Serial.printf(">>> STABLE OBJECT CONFIRMED: ID:%d\n", trackedObjects[i].id);
                }
            }
          }
        }
      }

      // =========================================================
      // 3. NEW OBJECT PASS
      // =========================================================
      for (int i = 0; i < numDetections; i++) {
        // Create new object only if it survived clustering and wasn't matched
        if (isValid[i] && !isMatched[i]) {
          int slot = -1;
          for (int j = 0; j < MAX_TRACKED_OBJECTS; j++) {
            if (!trackedObjects[j].isActive) { slot = j; break; }
          }
          if (slot != -1) {
            trackedObjects[slot].id = nextTrackID++;
            trackedObjects[slot].target = detections[i].target;
            trackedObjects[slot].x = detections[i].x;
            trackedObjects[slot].y = detections[i].y;
            trackedObjects[slot].score = detections[i].score;
            trackedObjects[slot].startTime = currentTime;
            trackedObjects[slot].lastSeenTime = currentTime;
            trackedObjects[slot].firstInZoneTime = 0;
            trackedObjects[slot].isActive = true;
            trackedObjects[slot].hasTriggeredCapture = false;
            trackedObjects[slot].hitStreak = 1;
            trackedObjects[slot].isStable = false;
            Serial.printf(">>> NEW: %s (ID:%d)\n", 
              (detections[i].target == 1 ? "Car" : "Mot"), trackedObjects[slot].id);
          }
        }
      }

      // =========================================================
      // 4. TIMEOUT & ALERT CHECK (With Temporal Filtering)
      // =========================================================
      for (int i = 0; i < MAX_TRACKED_OBJECTS; i++) {
        if (trackedObjects[i].isActive) {
          
          long timeSinceLastSeen = currentTime - trackedObjects[i].lastSeenTime;

          // 1. Kill old objects that left the camera
          if (timeSinceLastSeen > TIMEOUT_THRESHOLD) {
            trackedObjects[i].isActive = false;
            if (trackedObjects[i].isStable) Serial.printf("<<< LOST STABLE: ID:%d\n", trackedObjects[i].id);
          
          // 2. Kill "Ghosts" aggressively (flickered once and vanished)
          } else if (!trackedObjects[i].isStable && timeSinceLastSeen > GHOST_TIMEOUT) {
            trackedObjects[i].isActive = false; 
            
          // 3. Process timers ONLY for officially stable objects
          } else if (trackedObjects[i].isStable) {
      
            Point streamPt = mapAiToPercentage(trackedObjects[i].x, trackedObjects[i].y);
            bool inZone = isInsideZone(streamPt.x, streamPt.y);
            
            float dur = 0.0;

            bool anyZoneEnabled = config.numZones > 0;
            if (anyZoneEnabled) {
                if (inZone) {
                    if (trackedObjects[i].firstInZoneTime == 0) {
                        trackedObjects[i].firstInZoneTime = currentTime;
                    }
                    dur = (currentTime - trackedObjects[i].firstInZoneTime) / 1000.0;
                } else {
                    trackedObjects[i].firstInZoneTime = 0;
                    dur = 0.0;
                }
            } else {
                dur = (currentTime - trackedObjects[i].startTime) / 1000.0;
            }

            // Only print logs for stable objects to keep your console clean
            Serial.printf("ID:%d | %ds | Score:%d | InZone:%s\n", 
            trackedObjects[i].id, (int)dur, trackedObjects[i].score, inZone ? "YES" : "NO");

            // Apprehension Trigger
            if (inZone && dur >= config.apprehensionTimer && !trackedObjects[i].hasTriggeredCapture) {
                   UploadRequest msg;
                   msg.id = trackedObjects[i].id;
                   msg.target = trackedObjects[i].target;
                   msg.score = trackedObjects[i].score;
                   msg.x = streamPt.x;
                   msg.y = streamPt.y;
                   
                   if(xQueueSend(uploadQueue, &msg, 0) == pdTRUE) {
                       if(UploadTaskHandle != NULL) xTaskNotifyGive(UploadTaskHandle);
                       Serial.println("⚡ Upload Requested");
                   }
                   trackedObjects[i].hasTriggeredCapture = true; 
               }
          }
        }
      }
    }
    vTaskDelay(10 / portTICK_PERIOD_MS); 
  }
}

// ---------------------------------------------------------
// FUNCTION: PERFORM BINARY UPLOAD
// ---------------------------------------------------------
void performBinaryUpload(UploadRequest req) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Error: WiFi not connected. Cannot upload.");
        return;
    }

    // 1. LOCK CAMERA
    if (xSemaphoreTake(cameraMutex, portMAX_DELAY) == pdTRUE) {
        
        Serial.println("\n--- ALERT TRIGGERED: CAPTURING ---");

        // ---> FLAG 1: TELL CORE 1 TO SEND "CAPTURING" <---
        pendingUploadStatus = 1; 

        HTTPClient http;
        client.setInsecure();
        client.setTimeout(20000); 
        http.setConnectTimeout(5000);

        // Stop streaming temporarily
        myCAM.stopPreview(); 
        delay(5000);

        // Capture
        myCAM.takePicture(HIGH_RES_MODE, format); 
        
        size_t jpgSize = myCAM.getReceivedLength();
        if (jpgSize == 0) {
            Serial.println("Error: Image size is 0.");
            pendingUploadStatus = 3; // FLAG 3: Failed
            myCAM.startPreview(getCamMode(config.streamResolution));
            xSemaphoreGive(cameraMutex);
            return;
        }

        Serial.print("Image Size: "); Serial.print(jpgSize); Serial.println(" bytes");

        // Allocate Buffer
        uint8_t* imageBuffer = new uint8_t[jpgSize];
        if (!imageBuffer) {
            Serial.println("Error: Failed to allocate Buffer");
            pendingUploadStatus = 3; // FLAG 3: Failed
            myCAM.startPreview(getCamMode(config.streamResolution));
            xSemaphoreGive(cameraMutex);
            return;
        }

        // Read Buffer
        for (size_t i = 0; i < jpgSize; i++) {
            imageBuffer[i] = myCAM.readByte();
            if (i % 2048 == 0) vTaskDelay(1 / portTICK_PERIOD_MS); 
        }

        // UNLOCK CAMERA NOW (Data is safe in RAM, AI can resume)
        myCAM.startPreview(getCamMode(config.streamResolution));
        xSemaphoreGive(cameraMutex); 

        // 2. CONSTRUCT PAYLOAD
        String vehicleType = (req.target == 1) ? "Car" : "Motorcycle";
        JSONVar payload;
        payload["vehicleType"] = vehicleType;
        payload["plateNumber"] = "PENDING_VERIFICATION"; 
        payload["confidenceScore"] = req.score;
        payload["x_coordinate"] = req.x;
        payload["y_coordinate"] = req.y;
        payload["cameraSerialNumber"] = PRODUCT_SERIAL_NUMBER;
        String jsonMetadata = JSON.stringify(payload);

        // 3. STANDARD BLOCKING UPLOAD
        if (http.begin(client, API_APPREHENSION)) {
            http.addHeader("Content-Type", "image/jpeg");
            http.addHeader("X-Metadata", jsonMetadata);
            
            Serial.println("Uploading Binary...");
            int httpResponseCode = http.POST(imageBuffer, jpgSize);

            if (httpResponseCode > 0) {
                Serial.printf("Success! Code: %d\n", httpResponseCode);
                pendingUploadStatus = 2; // ---> FLAG 2: COMPLETE! <---
            } else {
                Serial.printf("Error: %s\n", http.errorToString(httpResponseCode).c_str());
                pendingUploadStatus = 3; // FLAG 3: Failed
            }
            http.end();
        } else {
            Serial.println("Unable to connect to server");
            pendingUploadStatus = 3; // FLAG 3: Failed
        }

        delete[] imageBuffer; // Cleanup
        Serial.println("--- UPLOAD COMPLETE ---\n");
    }
}

// ---------------------------------------------------------
// TASK: UPLOAD MANAGER (Sleeping Task on Core 0)
// ---------------------------------------------------------
void TaskCaptureAndUpload(void * params) {
    UploadRequest req;
    for(;;) {
        // Sleep until notified by AI Task
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        // Process all pending requests in the queue
        while(xQueueReceive(uploadQueue, &req, 0) == pdTRUE) {
            performBinaryUpload(req);
            vTaskDelay(100 / portTICK_PERIOD_MS); 
        }
    }
}


void setup() {
  Serial.begin(115200);

 // Allow allocation of all timers
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  panServo.setPeriodHertz(50);
  panServo.attach(SERVO_PIN_PAN, 500, 2400);

  tiltServo.setPeriodHertz(50);
  tiltServo.attach(SERVO_PIN_TILT, 500, 2400);

  // 1. Create Mutex & Queue
  cameraMutex = xSemaphoreCreateMutex();
  uploadQueue = xQueueCreate(10, sizeof(UploadRequest));

  // 1. Memory
  if (psramFound()) {
      chunkBuffer = (uint8_t*)ps_malloc(MAX_IMAGE_SIZE);
  } else {
      chunkBuffer = (uint8_t*)malloc(MAX_IMAGE_SIZE);
  }
  // 3. Servos
  panServo.attach(SERVO_PIN_PAN);
   tiltServo.attach(SERVO_PIN_TILT);

  WiFiManager wm;
  
  // Optional: Reset settings for testing (Uncomment to force the portal every time)
  //wm.resetSettings(); 

  // Set a timeout so if nobody connects to the portal, it eventually reboots
  wm.setConfigPortalTimeout(180); // 3 minutes
  wm.setConnectTimeout(10);

  // This creates an Access Point called "SentryAI_Setup"
  // If it fails to connect to a known network, it halts here and waits.
  Serial.println("Connecting to WiFi or starting Setup Portal...");
  if (!wm.autoConnect("SentryAI_Setup")) {
    Serial.println("Failed to connect and hit timeout. Rebooting...");
    delay(3000);
    ESP.restart();
  }

  // If you get here, you are connected to the internet!
  Serial.println("");
  Serial.println("✅ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  Wire.begin();
  #if SSCMA_CONNECT_TO_XIAO_S3
    AI.begin(&Wire);
  #endif
  Serial.println("AI Camera ready.");

  // 5. Start Camera
  myCAM.begin();
  myCAM.registerCallBack(readBuffer, 254, stop_preview);
  // =======================================================
  // --- APPLY ALPR GLARE REDUCTION SETTINGS ---
  // =======================================================
    // 1. Foundation: Set to maximum JPEG compression quality
  myCAM.setEV(CAM_EV_LEVEL_MINUS_3);
  myCAM.setContrast(CAM_CONTRAST_LEVEL_3);

  Serial.println("Capture Camera ready with ALPR settings.");

  // put your setup code here, to run once:
  
  for (int i = 0; i < MAX_TRACKED_OBJECTS; i++) {
    trackedObjects[i].isActive = false;
    trackedObjects[i].hasTriggeredCapture = false;
  }

  webSocket.beginSSL(WS_HOST, WS_PORT, WS_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(1000);
  webSocket.enableHeartbeat(10000, 3000, 1);

  // ============================================================
  // 🚀 BLOCKING WAIT FOR CONFIGURATION
  // ============================================================
  Serial.println("[Setup] Waiting for Database Config...");
  unsigned long startWait = millis();
  
  // Wait up to 5 seconds for the config to arrive from backend
  while (!configReceived && millis() - startWait < 5000) {
      webSocket.loop(); 
      delay(10);
  }
  
  if (configReceived) {
      Serial.println("✅ Configuration Synced from DB.");
  } else {
      Serial.println("⚠️ Warning: Config Sync Timed Out. Using Defaults.");
  }

  xTaskCreatePinnedToCore(
    keepWifiAlive,
    "Automatic Reconnection to WiFi",
    5000,
    NULL,
    1,
    NULL,
    0
  );

  xTaskCreatePinnedToCore(
    FOMOTask,         // Function to call
    "FOMO Inference",       // Name for debugging
    5000,          // Stack size (Adjust if you get Stack Overflow)
    NULL,           // Parameters
    1,              // Priority
    &FOMOTaskHandle,  // Handle
    1               // Core 1 (Application Core)
  );

  xTaskCreatePinnedToCore(
    TaskCaptureAndUpload, 
    "Upload Apprehended Vehicle", 
    10000, 
    NULL, 
    1, 
    &UploadTaskHandle, 
    0 // Core 0
  );  
}

void loop() {
  webSocket.loop();
  applyServoSettings();
  
  if (isConnected) {

    // =========================================================
    // --- NEW: PROCESS WEBSOCKET MESSAGES FOR CORE 0 ---
    // =========================================================
    if (pendingUploadStatus != 0) {
        if (pendingUploadStatus == 1) {
            webSocket.sendTXT("{\"type\":\"upload_status\", \"message\":\"capturing\"}");
        } 
        else if (pendingUploadStatus == 2) {
            webSocket.sendTXT("{\"type\":\"upload_status\", \"message\":\"complete\"}");
        } 
        else if (pendingUploadStatus == 3) {
            webSocket.sendTXT("{\"type\":\"upload_status\", \"message\":\"failed\"}");
        }
        pendingUploadStatus = 0; // Reset flag after sending!
    }

    if (config.streamEnabled) {
        // Check Mutex without blocking
        if (xSemaphoreTake(cameraMutex, 1 / portTICK_PERIOD_MS) == pdTRUE) {
            myCAM.captureThread();
            xSemaphoreGive(cameraMutex);
        }
    }

    // 2. Send Heartbeat (Every 30s)
    if (millis() - lastHeartbeatTime > 10000) {
        webSocket.sendTXT("{\"type\":\"heartbeat\"}");
        lastHeartbeatTime = millis();
    }
  }
}