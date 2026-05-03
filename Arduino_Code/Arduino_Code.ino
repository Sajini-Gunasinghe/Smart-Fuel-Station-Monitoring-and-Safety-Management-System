#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <time.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HardwareSerial.h>
#include <DFRobotDFPlayerMini.h>
#include <HX711.h>

// ==========================================
// CREDENTIALS
// ==========================================
#define WIFI_SSID     ""
#define WIFI_PASSWORD ""
#define API_KEY       ""
#define DATABASE_URL  ""

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;
unsigned long lastSendTime = 0;
const long sendInterval = 3000;

// ==========================================
// OLED DISPLAY CONFIGURATION
// ==========================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ==========================================
// DFPLAYER CONFIGURATION
// ==========================================
HardwareSerial mySoftwareSerial(2);
DFRobotDFPlayerMini myDFPlayer;
bool dfPlayerOK = false;  // track if DFPlayer initialized

// ==========================================
// PIN DEFINITIONS & SETTINGS
// ==========================================
const int sensorA = 18;
const int sensorB = 19;
const int sensorC = 32;
const int sensorD = 33;

const int flamePin     = 25;
const int servoPin     = 26;
const int gasPin       = 13;
const int gasPinAnalog = 34;
const int buzzerPin    = 23;

const int pressureOUT = 14;
const int pressureSCK = 27;

// ==========================================
// THRESHOLDS
// ==========================================
const int MAX_CAPACITY = 15;
long PRESSURE_SAFE     = 10000;
long PRESSURE_WARNING  = 20000;
long PRESSURE_TRIGGER  = 50000;

// ==========================================
// SMOOTHING FILTER VARIABLES
// ==========================================
const int SMOOTH_SAMPLES = 5;

// Gas smoothing
int  gasReadings[5]   = {0, 0, 0, 0, 0};
int  gasIndex         = 0;
int  gasSmoothed      = 0;

// Pressure smoothing
long pressureReadings[5] = {0, 0, 0, 0, 0};
int  pressureIndex       = 0;
long pressureSmoothed    = 0;

// ==========================================
// GLOBAL VARIABLES
// ==========================================
int totalQueue    = 0;
int gate1_state   = 0;
int gate2_state   = 0;

int  lastQueue         = -1;
bool lastFireState     = false;
bool lastGasState      = false;
bool lastPressureState = false;

unsigned long gasDetectStartTime = 0;
bool confirmedGasLeak = false;
int  gasPPM           = 0;
String gasLevel       = "SAFE";

HX711 pressureSensor;
long   currentPressureRAW = 0;
String pressureLevel      = "SAFE";
int    pressurePct        = 0;

Servo bucketServo;
int holdAngle = 0;
int dropAngle = 90;

// ==========================================
// OLED STATUS HELPER
// Shows progress during setup so screen
// does not stay stuck on SYSTEM LOADING
// ==========================================
void showStatus(String line1, String line2 = "") {
  display.clearDisplay();
  display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(5, 3);
  display.print("SMART FUEL STATION");
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(5, 20);
  display.print(line1);
  if (line2 != "") {
    display.setCursor(5, 35);
    display.print(line2);
  }
  display.display();
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== SMART FUEL STATION STARTING ===");

  // ── OLED Init ────────────────────────────────────────────────
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed — continuing without display");
  } else {
    // Boot screen
    display.clearDisplay();
    display.drawRoundRect(10, 10, 108, 44, 5, SSD1306_WHITE);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(22, 28);
    display.println("SYSTEM LOADING");
    display.drawLine(22, 40, 106, 40, SSD1306_WHITE);
    display.display();
    delay(1000);
  }

  // ── DFPlayer — with timeout so it never blocks ───────────────
  showStatus("DFPlayer init...");
  Serial.println("Starting DFPlayer...");
  mySoftwareSerial.begin(9600, SERIAL_8N1, 16, 17);
  delay(500);

  // Give DFPlayer max 3 seconds to respond
  unsigned long dfStart = millis();
  bool dfStarted = false;
  while (millis() - dfStart < 3000) {
    if (myDFPlayer.begin(mySoftwareSerial)) {
      dfStarted = true;
      break;
    }
    delay(100);
  }

  if (dfStarted) {
    myDFPlayer.volume(20);
    dfPlayerOK = true;
    Serial.println("DFPlayer OK");
    showStatus("DFPlayer OK");
  } else {
    Serial.println("DFPlayer FAILED — continuing");
    showStatus("DFPlayer SKIP", "continuing...");
  }
  delay(800);

  // ── Pin modes ─────────────────────────────────────────────────
  pinMode(sensorA, INPUT);
  pinMode(sensorB, INPUT);
  pinMode(sensorC, INPUT);
  pinMode(sensorD, INPUT);
  pinMode(flamePin, INPUT);
  pinMode(gasPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // ── Servo ─────────────────────────────────────────────────────
  bucketServo.setPeriodHertz(50);
  bucketServo.attach(servoPin, 500, 2400);
  bucketServo.write(holdAngle);
  Serial.println("Servo OK");

  // ── Pressure sensor ───────────────────────────────────────────
  showStatus("Pressure sensor", "calibrating...");
  pressureSensor.begin(pressureOUT, pressureSCK);
  // Wait max 3 seconds for HX711 to be ready
  unsigned long hxStart = millis();
  while (!pressureSensor.is_ready() && millis() - hxStart < 3000) {
    delay(100);
  }
  if (pressureSensor.is_ready()) {
    pressureSensor.tare();
    Serial.println("Pressure sensor OK — tared");
    showStatus("Pressure OK");
  } else {
    Serial.println("Pressure sensor NOT ready — continuing");
    showStatus("Pressure SKIP", "continuing...");
  }
  delay(800);

  // ── WiFi — with timeout so it never blocks forever ───────────
  showStatus("Connecting WiFi", WIFI_SSID);
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
    showStatus("WiFi OK", WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi FAILED — continuing offline");
    showStatus("WiFi FAILED", "offline mode");
  }
  delay(800);

  // ── NTP time sync — with timeout ──────────────────────────────
  if (WiFi.status() == WL_CONNECTED) {
    showStatus("Syncing time...");
    Serial.print("Syncing NTP time");
    configTime(5 * 3600 + 30 * 60, 0, "pool.ntp.org");

    unsigned long ntpStart = millis();
    while (time(nullptr) < 100000 && millis() - ntpStart < 10000) {
      Serial.print(".");
      delay(500);
    }

    if (time(nullptr) >= 100000) {
      Serial.println("\nTime synced OK");
      showStatus("Time synced OK");
    } else {
      Serial.println("\nNTP sync FAILED — continuing");
      showStatus("Time FAILED", "continuing...");
    }
    delay(800);

    // ── Firebase ───────────────────────────────────────────────
    showStatus("Firebase init...");
    Serial.println("Connecting to Firebase...");
    config.api_key      = API_KEY;
    config.database_url = DATABASE_URL;

    if (Firebase.signUp(&config, &auth, "", "")) {
      Serial.println("Firebase signup OK");
      signupOK = true;
      showStatus("Firebase OK");
    } else {
      Serial.println("Firebase signup FAILED");
      showStatus("Firebase FAILED", "retrying...");
    }

    config.token_status_callback = tokenStatusCallback;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    delay(800);
  }

  // ── All done ──────────────────────────────────────────────────
  Serial.println("=== SETUP COMPLETE ===");
  showStatus("System READY", signupOK ? "Firebase: OK" : "Offline mode");
  delay(1500);
}

// ==========================================
// OLED MAIN SCREEN
// ==========================================
void updateScreen(int currentQueue, bool isFire,
                  bool isHighPressure, bool isGas) {
  display.clearDisplay();

  if (isFire) {
    display.fillRect(0, 0, 128, 64, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK);
    display.setTextSize(1);
    display.setCursor(20, 5);
    display.print("! CRITICAL ALERT !");
    display.setTextSize(3);
    display.setCursor(20, 20);
    display.print("FIRE!");
    display.setTextSize(1);
    display.setCursor(25, 50);
    display.print("SAND DEPLOYED");

  } else if (isGas) {
    display.fillRect(0, 0, 128, 64, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK);
    display.setTextSize(2);
    display.setCursor(15, 15);
    display.print("GAS LEAK!");
    display.setTextSize(1);
    display.setCursor(35, 45);
    display.print("EVACUATE");

  } else {
    display.setTextColor(SSD1306_WHITE);
    display.drawRoundRect(0, 0, 128, 64, 3, SSD1306_WHITE);
    display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
    display.setTextSize(1);
    display.setTextColor(SSD1306_BLACK);
    display.setCursor(10, 3);
    display.print("SMART FUEL STATION");
    display.setTextColor(SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(5, 22);
    display.print("Queue:");
    display.setTextSize(2);
    if (currentQueue < 10) display.setCursor(15, 33);
    else display.setCursor(5, 33);
    display.print(currentQueue);

    display.setTextSize(1);
    display.setCursor(70, 22);
    display.print("TANK PRESS.");
    display.setCursor(75, 35);
    if (isHighPressure) {
      display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
      display.print("! HIGH !");
      display.setTextColor(SSD1306_WHITE);
    } else {
      display.print(" NORMAL ");
    }

    display.drawLine(0, 50, 128, 50, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(5, 54);
    display.print("LOAD:");
    display.drawRect(38, 54, 80, 7, SSD1306_WHITE);
    int fillWidth = (currentQueue * 76) / MAX_CAPACITY;
    if (fillWidth > 76) fillWidth = 76;
    if (fillWidth < 0)  fillWidth = 0;
    display.fillRect(40, 55, fillWidth, 5, SSD1306_WHITE);
  }

  display.display();
}

// ==========================================
// LOOP
// ==========================================
void loop() {

  // ── Flame sensor ─────────────────────────────────────────────
  bool currentFireState = (digitalRead(flamePin) == HIGH);
  bool rawGasState      = (digitalRead(gasPin)   == LOW);
  static bool currentHighPressure = false;

  // ── Gas debounce filter ───────────────────────────────────────
  if (rawGasState) {
    if (gasDetectStartTime == 0) gasDetectStartTime = millis();
    if (millis() - gasDetectStartTime >= 2000) confirmedGasLeak = true;
  } else {
    gasDetectStartTime = 0;
    confirmedGasLeak   = false;
  }

  // ── Gas analog — smoothed moving average ─────────────────────
  int rawGasAnalog = analogRead(gasPinAnalog);
  int rawGasPPM    = map(rawGasAnalog, 0, 4095, 0, 10000);

  gasReadings[gasIndex] = rawGasPPM;
  gasIndex = (gasIndex + 1) % SMOOTH_SAMPLES;

  long gasSum = 0;
  for (int i = 0; i < SMOOTH_SAMPLES; i++) gasSum += gasReadings[i];
  gasSmoothed = (int)(gasSum / SMOOTH_SAMPLES);
  gasPPM      = gasSmoothed;

  if      (gasPPM > 5000) gasLevel = "DANGER";
  else if (gasPPM > 3000) gasLevel = "WARNING";
  else                    gasLevel = "SAFE";

  // ── Pressure — smoothed moving average ───────────────────────
  if (pressureSensor.is_ready()) {
    long rawPressure = pressureSensor.get_value(3);

    pressureReadings[pressureIndex] = rawPressure;
    pressureIndex = (pressureIndex + 1) % SMOOTH_SAMPLES;

    long pressureSum = 0;
    for (int i = 0; i < SMOOTH_SAMPLES; i++) pressureSum += pressureReadings[i];
    pressureSmoothed   = pressureSum / SMOOTH_SAMPLES;
    currentPressureRAW = pressureSmoothed;

    if      (currentPressureRAW > PRESSURE_TRIGGER) currentHighPressure = true;
    else if (currentPressureRAW < PRESSURE_WARNING)  currentHighPressure = false;
  }

  long clampedPressure = max(0L, currentPressureRAW);
  pressurePct = (int)constrain(
    map(clampedPressure, 0, PRESSURE_TRIGGER, 0, 100), 0, 100
  );

  if      (clampedPressure > PRESSURE_TRIGGER) pressureLevel = "DANGER";
  else if (clampedPressure > PRESSURE_WARNING) pressureLevel = "WARNING";
  else                                          pressureLevel = "SAFE";

  // ── Audio alarms — only play if DFPlayer is working ──────────
  if (dfPlayerOK) {
    if (currentFireState    && !lastFireState)     myDFPlayer.play(1);
    if (confirmedGasLeak    && !lastGasState)      myDFPlayer.play(2);
    if (currentHighPressure && !lastPressureState) myDFPlayer.play(3);
  }

  // ── Actuator and buzzer control ───────────────────────────────
  if (currentFireState) {
    bucketServo.write(dropAngle);
    digitalWrite(buzzerPin, HIGH);
  } else if (confirmedGasLeak || currentHighPressure) {
    bucketServo.write(holdAngle);
    digitalWrite(buzzerPin, HIGH);
  } else {
    bucketServo.write(holdAngle);
    digitalWrite(buzzerPin, LOW);
  }

  // ── Queue logic ───────────────────────────────────────────────
  bool stateA = (digitalRead(sensorA) == LOW);
  bool stateB = (digitalRead(sensorB) == LOW);
  bool stateC = (digitalRead(sensorC) == LOW);
  bool stateD = (digitalRead(sensorD) == LOW);

  if (gate1_state == 0) {
    if      (stateA && !stateB) gate1_state = 1;
    else if (stateB && !stateA) gate1_state = 2;
  }
  if (gate1_state == 1 && stateB)             { totalQueue++;                    gate1_state = 3; }
  if (gate1_state == 2 && stateA)             { if (totalQueue > 0) totalQueue--; gate1_state = 3; }
  if (gate1_state == 3 && !stateA && !stateB) { gate1_state = 0; delay(50); }

  if (gate2_state == 0) {
    if      (stateC && !stateD) gate2_state = 1;
    else if (stateD && !stateC) gate2_state = 2;
  }
  if (gate2_state == 1 && stateD)             { totalQueue++;                    gate2_state = 3; }
  if (gate2_state == 2 && stateC)             { if (totalQueue > 0) totalQueue--; gate2_state = 3; }
  if (gate2_state == 3 && !stateC && !stateD) { gate2_state = 0; delay(50); }

  // ── Screen refresh ────────────────────────────────────────────
  if (totalQueue          != lastQueue        ||
      currentFireState    != lastFireState    ||
      confirmedGasLeak    != lastGasState     ||
      currentHighPressure != lastPressureState) {
    updateScreen(totalQueue, currentFireState,
                 currentHighPressure, confirmedGasLeak);
    lastQueue          = totalQueue;
    lastFireState      = currentFireState;
    lastGasState       = confirmedGasLeak;
    lastPressureState  = currentHighPressure;
  }

  // ── Firebase push to sensorHistory ───────────────────────────
  if (Firebase.ready() && signupOK &&
      (millis() - lastSendTime > sendInterval)) {
    lastSendTime = millis();

    time_t now = time(nullptr);
    struct tm* t = localtime(&now);
    char timestampKey[25];
    strftime(timestampKey, sizeof(timestampKey),
             "%Y-%m-%d_%H-%M-%S", t);

    String path = "/sensorHistory/" + String(timestampKey);

    Firebase.RTDB.setString(&fbdo, path + "/sensorID",    "ESP32_001");
    Firebase.RTDB.setString(&fbdo, path + "/timestamp",   String(timestampKey));
    Firebase.RTDB.setInt(&fbdo,    path + "/gasPPM",      gasPPM);
    Firebase.RTDB.setInt(&fbdo,    path + "/pressureRaw", currentPressureRAW);
    Firebase.RTDB.setInt(&fbdo,    path + "/pressurePct", pressurePct);
    Firebase.RTDB.setInt(&fbdo,    path + "/queueCount",  totalQueue);
    Firebase.RTDB.setBool(&fbdo,   path + "/fire",        currentFireState);
    Firebase.RTDB.setBool(&fbdo,   path + "/gasLeak",     confirmedGasLeak);
    Firebase.RTDB.setInt(&fbdo,    path + "/hour",        t->tm_hour);
    Firebase.RTDB.setInt(&fbdo,    path + "/dayOfWeek",   t->tm_wday);

    Serial.println("Saved: " + String(timestampKey) +
                   " | Gas: " + String(gasPPM) +
                   " PPM | Pressure: " + String(currentPressureRAW) +
                   " | Queue: " + String(totalQueue));
  }

  delay(20);
}
