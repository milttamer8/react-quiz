import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import common_uk from "./translations/uk/common.json";
import common_fr from "./translations/fr/common.json";
import common_gm from "./translations/gm/common.json";
import common_it from "./translations/it/common.json";
import common_sp from "./translations/sp/common.json";
import common_nl from "./translations/nl/common.json";
import common_sw from "./translations/sw/common.json";
import UserProfile from './session/UserProfile';

if(UserProfile.getLang() === null || UserProfile.getLang() === "null" || UserProfile.getLang() === undefined){
    console.log("null");
    UserProfile.setLang("uk");
}
else {
    console.log("not null");
    console.log(UserProfile.getLang());
}

i18next.init({
  interpolation: { escapeValue: false },  // React already does escaping
  lng: UserProfile.getSiteLang(),// language to use
  fallbackLng: UserProfile.getSiteLang(),// language to use
  resources: {
      uk: {
          common: common_uk               // 'common' is our custom namespace
      },
      fr: {
          common: common_fr
      },
      gm: {
          common: common_gm
      },
      it: {
          common: common_it
      },
      sp: {
          common: common_sp
      },
      nl: {
          common: common_nl
      },
      sw: {
          common: common_sw
      }
  },
});

ReactDOM.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18next}>
        <App/>
    </I18nextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
