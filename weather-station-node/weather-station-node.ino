#include <DHT.h>
#include <Wire.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#define SSID "ProtoSem"
#define PASSWORD "Protosem123"
#define MQTT_HOST "192.168.57.233"
#define MQTT_PORT 1883
#define MQTT_USERNAME "praniis"
#define MQTT_PASSWORD "praniis"
#define SEA_LEVEL_PRESSURE_HPA (1013.25)

#define DHT_PIN D3
#define GAS_SENSOR_PIN A0

WiFiClient espClient;
WiFiUDP ntpUDP;

Adafruit_BME280 bme;
DHT dht(DHT_PIN, DHT11);
PubSubClient mqtt(espClient);
NTPClient timeClient(ntpUDP, "pool.ntp.org");


void initWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(SSID, PASSWORD);
    Serial.println("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }
    Serial.println("Connected to the WiFi network");
}

void setup() {

    Serial.begin(115200);
    initWiFi();

    mqtt.setServer(MQTT_HOST, MQTT_PORT);

    while (!mqtt.connected()) {
        Serial.println("Connecting to MQTT...");
        if (mqtt.connect("station-1", MQTT_USERNAME, MQTT_PASSWORD)) {
            Serial.println("MQTT connected");
        } else {
            Serial.print("failed with state: ");
            Serial.print(mqtt.state());
            delay(2000);
        }
    }
    dht.begin();
    bme.begin(0x76);
    timeClient.begin();
}


void loop() {

    float gas_level = analogRead(GAS_SENSOR_PIN),
          humidity = dht.readHumidity(),
          temperature = dht.readTemperature(),
          temperature_bme = bme.readTemperature(),
          humidity_bme = bme.readHumidity(),
          pressure = bme.readPressure() / 100.0F,
          altitude = bme.readAltitude(SEA_LEVEL_PRESSURE_HPA);

    if (isnan(gas_level) || isnan(humidity) || isnan(temperature)) {
        return;
    }

    DynamicJsonDocument data(1024);

    // TODO: Later add new sensor data's
    data["temperature"] = temperature;
    data["humidity"] = humidity;
    data["wind_speed"] = "";
    data["wind_degree"] = "";
    data["wind_dir"] = "";
    data["cloudcover"] = "";
    data["pressure"] = pressure;
    data["uv_index"] = "";

    // Forge lat,lon
    data["lat"] = 11.0808836;
    data["lon"] = 76.9888493;

    // Epoch Time
    timeClient.update();
    data["dtime"] = timeClient.getEpochTime();

    String msg_to_send;
    serializeJson(data, msg_to_send);
    mqtt.publish("weather/raw-push", msg_to_send.c_str());

    mqtt.loop();
    delay(1000);
}
