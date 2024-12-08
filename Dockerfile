# Basis-Image
FROM node:18-alpine

# Arbeitsverzeichnis im Container erstellen und setzen
WORKDIR /usr/src/app

# Package-Dateien kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Anwendungscode kopieren
COPY ./app .

# Port für den Container öffnen
EXPOSE 3000

# Startbefehl definieren
CMD ["npm", "start"]
