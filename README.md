# 🔥 Smart Fuel Station Monitoring and Safety Management System

> **IT4021 — Internet of Things and Big Data Analytics**  
> Sri Lanka Institute of Information Technology (SLIIT)  
> Group 2026_40 

---
<img width="1909" height="966" alt="Screenshot 2026-05-03 171700" src="https://github.com/user-attachments/assets/9ae37a39-68cf-47d9-a3c8-aa50771ae084" />



## 📌 Project Overview

The **Smart Fuel Station Monitoring and Safety Management System** is a complete end-to-end IoT solution designed to improve safety, efficiency, and operational management at fuel stations. The system uses physical sensors connected to an ESP32 microcontroller to continuously collect real-time safety data, transmits it to a Firebase cloud database, and presents it through an interactive web-based dashboard with machine learning insights and an AI-powered conversational assistant.

Fuel stations are high-risk environments where gas leaks, fire hazards, abnormal tank pressure, and vehicle congestion can create serious safety problems. This system provides **real-time monitoring**, **automated safety responses**, and **intelligent data-driven insights** to address these challenges.

---

## 👥 Group Members

| Student ID | Name |
|---|---|
| IT22272690 | Gunasinghe S.N |
| IT22118486 | Amarakoon A.M.D.U |
| IT22336736 | Geesarani H.A.M. |
| IT22216328 | Navodya R.L.N |

---

## 🌟 Key Features

- ✅ **Real-time sensor monitoring** — Gas PPM, tank pressure, flame detection, vehicle queue count
- ✅ **Automated safety responses** — Buzzer alarm, servo-activated sand bucket fire suppression, voice alerts via DFPlayer Mini
- ✅ **Live OLED display** — Local status display independent of internet connectivity
- ✅ **7-page interactive dashboard** — Built with React.js and Recharts
- ✅ **Firebase real-time sync** — Sub-second dashboard updates via WebSocket listener
- ✅ **4 ML analyses** — Classification, anomaly detection, trend forecasting, correlation analysis
- ✅ **KMeans threshold learning** — Data-driven safety boundaries instead of hard-coded values
- ✅ **AI chatbot assistant** — Google Gemini API-powered with live sensor data context
- ✅ **CSV export** — Incident history download for compliance reporting

---

## 🛠️ Hardware Components

| Component | Model | GPIO Pins |
|---|---|---|
| Microcontroller | ESP32 Dev Module | — |
| Gas Sensor (analog) | MQ-2 | DO → GPIO 13, AO → GPIO 34 |
| Flame Sensor | IR Photodiode (KY-026) | GPIO 25 |
| Pressure Sensor | HX711 + Load Cell | DT → GPIO 14, SCK → GPIO 27 |
| IR Queue Sensors | 4x IR Sensors | GPIO 18, 19, 32, 33 |
| Servo Motor | SG90 | GPIO 26 |
| Buzzer | Active Buzzer | GPIO 23 |
| OLED Display | SSD1306 0.96" I2C | SDA, SCL |
| Audio Module | DFPlayer Mini | RX → GPIO 16, TX → GPIO 17 |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERCEPTION LAYER                          │
│   MQ-2 Gas  │  Flame  │  HX711 Pressure  │  IR Queue x4   │
│                    ESP32 Dev Module                          │
│         OLED Display │ Servo │ Buzzer │ DFPlayer            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / WiFi
┌──────────────────────────▼──────────────────────────────────┐
│                    NETWORK LAYER                             │
│         Firebase ESP Client Library (HTTPS PUT)              │
│         NTP Time Sync — Sri Lanka UTC+5:30                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  Firebase Realtime Database (Singapore)                      │
│  ├── /sensorHistory/{timestamp}  ← live sensor readings      │
│  └── /mlInsights                 ← ML analysis results       │
│                                                              │
│  React.js Dashboard (7 pages)                                │
│  Google Colab ML Pipeline (Python / scikit-learn)            │
│  Gemini API Chatbot (Node.js proxy server)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
Smart-Fuel-Station-Monitoring-and-Safety-Management-System/
│
├── fuel_dashboard/                  # React.js web dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Cards.js             # Reusable metric card components
│   │   │   ├── FloatingChat.js      # Persistent chatbot widget
│   │   │   └── Sidebar.js           # Navigation sidebar
│   │   ├── hooks/
│   │   │   ├── useFirebaseData.js   # Live sensor data subscription
│   │   │   └── useMLInsights.js     # ML results subscription
│   │   ├── pages/
│   │   │   ├── Overview.js          # Station status overview
│   │   │   ├── SafetyMonitoring.js  # Trend charts and gauges
│   │   │   ├── FireDetection.js     # 6-zone fire map
│   │   │   ├── QueueMonitor.js      # Vehicle capacity tracking
│   │   │   ├── AlertsReports.js     # Incident log and CSV export
│   │   │   ├── MLInsights.js        # ML analysis 4-tab page
│   │   │   └── ChatbotAgent.js      # AI assistant page
│   │   ├── App.js                   # Root component and routing
│   │   ├── firebase.js              # Firebase configuration
│   │   └── index.css                # Global styles
│   ├── server.js                    # Node.js proxy for Gemini API
│   ├── package.json
│   └── package-lock.json
│
├── arduino/
│   └── IOT.ino                      # ESP32 firmware (main sketch)
│
├── python/
│   ├── generate_data.py             # 7-day simulated dataset generator
│   └── ML_Analysis.ipynb            # Google Colab ML notebook
│
└── README.md
```

---

## 🗄️ Firebase Database Schema

### `/sensorHistory/{YYYY-MM-DD_HH-MM-SS}`

| Field | Type | Description |
|---|---|---|
| `sensorID` | String | Device identifier — `ESP32_001` |
| `timestamp` | String | NTP datetime — `YYYY-MM-DD_HH-MM-SS` |
| `gasPPM` | Integer | Gas concentration in estimated PPM |
| `pressureRaw` | Integer | Raw HX711 value — smoothed over 5 readings |
| `pressurePct` | Integer | Pressure as % of danger threshold (0-100) |
| `queueCount` | Integer | Vehicle count from IR gate logic (0-15) |
| `fire` | Boolean | Flame sensor detection status |
| `gasLeak` | Boolean | Confirmed gas leak after 2s debounce |
| `hour` | Integer | Hour of day 0-23 |
| `dayOfWeek` | Integer | Day of week 0-6 |

### `/mlInsights`

| Field | Type | Description |
|---|---|---|
| `classifierAccuracy` | Float | Best classification model accuracy % |
| `bestClassifier` | String | Winning model name |
| `trendDirection` | String | `Rising` or `Falling` |
| `predictedNextGasPPM` | Integer | Next predicted gas reading |
| `anomaliesDetected` | Integer | Count of anomalous readings |
| `anomalyRate` | Float | Anomaly rate percentage |
| `learnedSafeWarning` | Integer | KMeans learned gas Safe/Warning boundary |
| `learnedWarningDanger` | Integer | KMeans learned gas Warning/Danger boundary |
| `topFeature` | String | Most important sensor from classifier |
| `lastAnalyzed` | String | Timestamp of last ML run |

---

## 🤖 Machine Learning Pipeline

Four analyses are performed in Google Colab on historical sensor data:

| # | Analysis | Technique | Key Result |
|---|---|---|---|
| 0 | Threshold Learning | KMeans Clustering (k=3) | Learned gas boundaries from data — no hard-coded values |
| 1 | Safety Classification | Random Forest (best of 4 models) | 100% accuracy — gasPPM is top feature |
| 2 | Anomaly Detection | Local Outlier Factor (best of 3) | 5.01% anomaly rate — 250 unusual readings |
| 3 | Temporal Trend | Gradient Boosting (best of 3) | R²=0.8384 — Rising trend detected |
| 4 | Sensor Correlation | Pearson Correlation Matrix | Gas and Pressure are independent sensors |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- Arduino IDE with ESP32 board package installed
- Google Colab account (for ML analysis)
- Firebase account (free Spark plan)
- Ollama installed locally OR Google Gemini API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sajini-Gunasinghe/Smart-Fuel-Station-Monitoring-and-Safety-Management-System.git
cd Smart-Fuel-Station-Monitoring-and-Safety-Management-System
```

---

### 2. Firebase Setup

1. Go to [firebase.google.com](https://firebase.google.com) and create a new project
2. Enable **Realtime Database** — choose Singapore region
3. Set database rules to allow read/write for development:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Copy your Firebase config and update `fuel_dashboard/src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

---

### 3. Upload Arduino Firmware

1. Open `arduino/IOT.ino` in Arduino IDE
2. Install required libraries via **Sketch → Include Library → Manage Libraries**:
   - `Firebase ESP Client`
   - `ESP32Servo`
   - `Adafruit SSD1306`
   - `Adafruit GFX`
   - `DFRobotDFPlayerMini`
   - `HX711 Arduino Library`
3. Update credentials in the sketch:
```cpp
#define WIFI_SSID     "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define API_KEY       "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL  "YOUR_FIREBASE_DATABASE_URL"
```
4. Select **Board: ESP32 Dev Module** and the correct COM port
5. Click **Upload**

> **Note:** If upload fails with port busy error, close the Serial Monitor first. If sketch size is at 99% hold the BOOT button on the ESP32 during upload.

---

### 4. Install Dashboard Dependencies

```bash
cd fuel_dashboard
npm install
```

---

### 5. Configure the Gemini API Chatbot

Get a free API key from [aistudio.google.com](https://aistudio.google.com) and update `server.js`:

```javascript
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

---

### 6. Run the Application

Open **two terminals**:

**Terminal 1 — Start the proxy server:**
```bash
cd fuel_dashboard
node server.js
```
You should see:
```
Proxy server running on http://localhost:3001
```

**Terminal 2 — Start the React dashboard:**
```bash
cd fuel_dashboard
npm start
```

The dashboard opens automatically at [http://localhost:3000](http://localhost:3000)

---

### 7. Run the ML Analysis (Optional)

1. Open `python/ML_Analysis.ipynb` in Google Colab
2. Upload your `serviceAccountKey.json` from Firebase Console
3. Run all cells from top to bottom
4. Results are automatically pushed to Firebase `/mlInsights`
5. The ML Insights dashboard page updates automatically

---

## 📊 Dashboard Pages

| Page | Description |
|---|---|
| **Overview** | Overall station status, gas and pressure gauges, sensor status list, recent readings table |
| **Safety Monitoring** | Gas concentration trend, pressure trend, queue count trend, hazard events timeline |
| **Fire Detection** | 6-zone station map, sand bucket suppression status per zone, fire events log |
| **Queue Monitor** | Vehicle slot grid, station load bar, queue history chart |
| **Alerts and Reports** | Severity-filtered incident log, CSV export |
| **ML Insights** | 4-tab ML results — Classification, Anomaly, Trend Forecast, Correlation |
| **AI Assistant** | Google Gemini chatbot with live sensor data context |

---

## ⚠️ Gas Safety Thresholds

| Level | Gas PPM | Pressure Raw | Action |
|---|---|---|---|
| 🟢 SAFE | 0 – 3,000 | 0 – 50,000 | Normal operation |
| 🟡 WARNING | 3,000 – 5,000 | 50,000 – 300,000 | Monitor closely, increase ventilation |
| 🔴 DANGER | > 5,000 | > 800,000 | Buzzer + automatic suppression activated |

> Thresholds are also **learned from actual sensor data** using KMeans clustering in the ML pipeline.

---

## 🔧 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| OLED stuck on SYSTEM LOADING | DFPlayer Mini not connected or WiFi timeout | Check DFPlayer wiring, ensure WiFi credentials are correct |
| Dashboard shows Disconnected | Firebase rules not set or wrong API key | Check Firebase database rules and credentials in `firebase.js` |
| Chatbot shows Connection error | Proxy server not running or API key invalid | Run `node server.js` in Terminal 1, verify Gemini API key |
| Upload fails — port busy | Serial Monitor is open | Close Serial Monitor before uploading |
| Gas gauge fluctuating | Sensor noise — normal behaviour | Moving average smoothing is already applied in firmware |
| pressureRaw shows negative values | HX711 noise at rest | Values clamped to 0 by firmware — normal behaviour |

---

## 📡 Communication Protocol

The system uses **HTTPS** (not MQTT) for data transmission because:
- Firebase Realtime Database natively uses HTTPS
- The Firebase ESP Client library handles authentication and transmission automatically
- No separate broker server is required
- 3-second transmission intervals make MQTT's bandwidth advantages negligible

---

## 🔌 Pin Reference

```
ESP32 Pin Layout:
─────────────────────────────────────────────
GPIO 13  →  MQ-2 Digital Output (gas alarm)
GPIO 34  →  MQ-2 Analog Output  (gas PPM)
GPIO 25  →  Flame Sensor (KY-026)
GPIO 14  →  HX711 DT (pressure data)
GPIO 27  →  HX711 SCK (pressure clock)
GPIO 18  →  IR Sensor A (gate 1 entry)
GPIO 19  →  IR Sensor B (gate 1 exit)
GPIO 32  →  IR Sensor C (gate 2 entry)
GPIO 33  →  IR Sensor D (gate 2 exit)
GPIO 26  →  Servo Motor SG90 (sand bucket)
GPIO 23  →  Active Buzzer
GPIO 16  →  DFPlayer RX (audio)
GPIO 17  →  DFPlayer TX (audio)
SDA/SCL  →  OLED SSD1306 (I2C)
─────────────────────────────────────────────
```


## 🙏 Acknowledgements

- [Firebase](https://firebase.google.com/) — Real-time database and hosting
- [Google Gemini API](https://ai.google.dev/) — AI chatbot language model
- [Recharts](https://recharts.org/) — React chart library
- [scikit-learn](https://scikit-learn.org/) — Machine learning library
- [HX711 Library](https://github.com/bogde/HX711) — Load cell amplifier
- [Firebase ESP Client](https://github.com/mobizt/Firebase-ESP-Client) — ESP32 Firebase library
- Ceylon Petroleum Corporation — Safety threshold reference standards

---

*Developed by Group 2026_40 — SLIIT Faculty of Computing — 2026*
