import React, {useEffect, useState} from 'react';
import './Profile.css';
import * as firebase from 'firebase';
import { useHistory } from "react-router-dom";
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Insert user in db
 *   Display the user profile infos
*/
export default function Profile(props) {
    const db = firebase.firestore();
    let history = useHistory();
    const auth = firebase.auth();

    const site = UserProfile.getSite();
    const country = UserProfile.getCountry();
    const [user, setuser] = useState(null);
    const {t} = useTranslation('common');

    const loader = UserProfile.getSite() === 'core' ? 'loader.svg' : 'loader-sr.svg';

    useEffect(() => {
        if(props.location.state){
          if(props.location.state.user){
            console.log("about to check");
            checkUserConnected(props.location.state.user);
          }
          else {
                logout();
          }
        }
        else {
          logout();
        }
        return () => {
            
        }
    }, []);

    const checkUserConnected = (tmpUser) => {
      if(auth.currentUser !== null){
        console.log("logged in profile");
        console.log(auth.currentUser);
        // check if user still has team
        props.changeLoaderStatus();
        checkIfUserExist(tmpUser, auth.currentUser.uid);
      }
      else {
          console.log("not logged in profile");
          history.push('/');
      }
      
      /*
      auth.onAuthStateChanged(firebaseUser => {
          if(firebaseUser){
              console.log("logged in profile");
              console.log(firebaseUser);
              // check if user still has team
              props.changeLoaderStatus();
              checkIfUserExist(tmpUser);
          }
          else {
              console.log("not logged in profile");
              history.push('/');
          }
      })
      */
    }

    const checkIfUserExist = (tempUser, userUid) => {
      tempUser.uid = userUid;
      tempUser.status = "online";
      firebase.firestore().collection("users").doc(userUid).set(tempUser).then(function(){
        console.log("insertUser  then: ");
        UserProfile.initialize(
            tempUser.alias,
            tempUser.age,
            tempUser.avatar,
            tempUser.gender,
            tempUser.region,
            userUid
        );
        tempUser.uid = userUid;
        setuser(tempUser);
        console.log("user found");
        props.hideLoader();
      })
      .catch(error => {
          console.log(error);
          logout();
      });
    }

    const logout = () => {
        auth.signOut();
        props.hideLoader();
        history.push('/');
    }

    return (
      <div className="profile">
          {
            user ? 
            <div className="valid-user-profile-block">
              <h2 className="ttr">{t('here_profile.title')}</h2>
              <h3 className="sttr">{t('your_nickname.title')} 
              <strong className="strong">"{user.alias}"</strong></h3>
              <div className="user-profile">
                <img src={process.env.PUBLIC_URL + '/assets/images/avatars/' + (user.avatar !== "" ? user.avatar : 'default.png')} alt=""/>
                <span>{user.alias}</span>
                <span>{user.age}{t('yo.title')} - {user.region}</span>
              </div>
              <button className="btn btn-primary" onClick={() => { history.push('/waiting-room', { user }); }}>{t('lets_play.title')}</button>
            </div>
            : 
            <div className="loaderInit"><img src={process.env.PUBLIC_URL + '/assets/images/avatars/' + loader } alt="loader"/></div>
            
          }
      </div>
    );
}