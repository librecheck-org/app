import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.librecheck.app",
  appName: "LibreCheck",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
