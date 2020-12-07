const environment = process.env.REACT_APP_ENV
  ? process.env.REACT_APP_ENV
  : "local";

interface Config {
  baseUrl: string;
}

const appConfig: Record<string, Config> = {
  prod: {
    baseUrl: "https://api.pandemic.live",
  },
  local: {
    baseUrl: "http://localhost:8080",
  },
};

export const APPCONFIG = appConfig[environment];
