#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>

WebSocketsClient webSocket;
const char* websocketServer = "http://localhost:4000"; // Cambiar por tu IP
//const char* websocketServer = "https://web-production-5f93.up.railway.app"; // Probar con produccion

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("Desconectado del WS");
      break;
    case WStype_CONNECTED:
      Serial.println("Conectado al WS");
      webSocket.sendTXT("{\"action\":\"register\",\"deviceId\":\"chapa_principal\"}");
      break;
    case WStype_TEXT:
      // Ejemplo de payload: {"deviceId":"chapa_principal","action":"abrir"}
      procesarComando((char*)payload);
      break;
  }
}

void procesarComando(String json) {
  // Parsear JSON y actuar sobre relés
  if(json.indexOf("abrir") != -1) {
    digitalWrite(RELE_PIN, HIGH);
    webSocket.sendTXT("{\"deviceId\":\"chapa_principal\",\"status\":\"abierta\"}");
  } else if(json.indexOf("cerrar") != -1) {
    digitalWrite(RELE_PIN, LOW);
    webSocket.sendTXT("{\"deviceId\":\"chapa_principal\",\"status\":\"cerrada\"}");
  }
}

void setup() {
  // Configuración inicial WiFi...
  webSocket.begin(websocketServer, PORT, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  // Opcional: Enviar estado periódicamente
  static unsigned long lastSend = 0;
  if(millis() - lastSend > 30000) {
    webSocket.sendTXT("{\"deviceId\":\"chapa_principal\",\"status\":\"cerrada\"}");
    lastSend = millis();
  }
}