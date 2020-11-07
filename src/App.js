import React, { Component } from 'react';
import './App.css';
import Registration from './components/Registration';
import GamePlatform from './components/GamePlatform';
import WaitingRoom from './components/WaitingRoom';
import Admin from './components/bo/Home';
import Header from './components/Layouts/Header';
import Footer from './components/Layouts/Footer';
import * as firebase from 'firebase';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import LoadingOverlay from 'react-loading-overlay';
import Profile from './components/Profile';
import Login from './components/bo/Login';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BlockUi from 'react-block-ui';
import 'react-block-ui/style.css';
import Survey from './components/Survey';
import TermsConditions from './components/TermsConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookePolicy from './components/CookiePolicy';
import UserProfile from './session/UserProfile';

const firebaseConfig = {
  apiKey: "AIzaSyAhodei7teagk7gpq0zt000rwspZ9AUZfc",
  authDomain: "dev2jeumeetic.firebaseapp.com",
  databaseURL: "https://dev2jeumeetic.firebaseio.com",
  projectId: "dev2jeumeetic",
  storageBucket: "dev2jeumeetic.appspot.com",
  messagingSenderId: "332477058875",
  appId: "1:332477058875:web:6ace1dc8773ef27c4e311e",
  measurementId: "G-1VH12VSBDD"
};

firebase.initializeApp(firebaseConfig);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaderActive: false,
      message_online: "You are online.",
      message_ofline: "You are offline.",
      blocking: false,
    };
  }

  changeLoaderStatus = () => {
    this.setState({ loaderActive: !this.state.loaderActive });
  }

  hideLoader = () => {
    this.setState({ loaderActive: false });
  }

  setBlocking = (status) => {
    if (status) {
      toast.success(this.state.message_online);
      this.setState({blocking: false});
    }
    else {
      toast.error(this.state.message_ofline);
      this.setState({blocking: true});
    }
  }
  
  render() {
    return (
        <Router>
          <BlockUi tag="div" blocking={this.state.blocking} message="You just turned offline. You will be ejected from the game." keepInView>
            <LoadingOverlay
                active={this.state.loaderActive}
                spinner
                fadeSpeed={500}
                text='Processing...'
                >
              <ToastContainer
                  position="bottom-left"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnVisibilityChange
                  draggable
                  pauseOnHover
                  onClose={() => alert("ok")}
              />
              <Header />
              <div className={"App " + UserProfile.getSite()}>
                <Switch>
                  <Route exact path="/" render={(props) => <Registration {...props} changeLoaderStatus={this.changeLoaderStatus} />} />
                  <Route exact path="/game-platform" render={(props) => <GamePlatform {...props} changeLoaderStatus={this.changeLoaderStatus} hideLoader={this.hideLoader} changeBlockingStatus={this.setBlocking} />}  />
                  <Route exact path="/profile" render={(props) => <Profile {...props} changeLoaderStatus={this.changeLoaderStatus} hideLoader={this.hideLoader} />} />
                  <Route exact path="/admin-login" render={(props) => <Login {...props} changeLoaderStatus={this.changeLoaderStatus} />} />
                  <Route exact path="/waiting-room" render={(props) => <WaitingRoom {...props} changeLoaderStatus={this.changeLoaderStatus} hideLoader={this.hideLoader} />} />
                  <Route exact path="/survey" render={(props) => <Survey {...props} changeLoaderStatus={this.changeLoaderStatus} hideLoader={this.hideLoader} />} />

                  <Route exact path="/terms-conditions" render={(props) => <TermsConditions {...props} />} />
                  <Route exact path="/privacy-policy" render={(props) => <PrivacyPolicy {...props} />} />
                  <Route exact path="/cookie-policy" render={(props) => <CookePolicy {...props} />} />

                  <Route component={Admin} exact path="/admin" />
                </Switch>
              </div>
              <Footer />
            </LoadingOverlay>
          </BlockUi>
        </Router>
    );
  }
}

export default App;
