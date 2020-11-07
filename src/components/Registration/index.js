import React, {useEffect, useState} from 'react';
import RegistrationForm from '../RegistrationForm';
import CountdownSession from '../CountdownSession';
import * as firebase from 'firebase';
import './Registration.css';
import UserProfile from '../../session/UserProfile';
import { useHistory } from "react-router-dom";
import ReactPlayer from 'react-player';
import { Image } from 'react-bootstrap';
import AudioPlayer from '../AudioPlayer';
import Countdown from '../Countdown';
import { useTranslation } from "react-i18next";
import CircleProgressBar from '../CircleProgressBar';
import CircleProgressBarRealDays from '../CircleProgressBarRealDays';
import * as Settings from '../../settings/constants.js';
import {
    isTablet,
    isIE
  } from "react-device-detect";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactJWPlayer from 'react-jw-player';

/*
 *   In home page, display countdown, video rules and the registration form component
*/
export default function Registration(props) {
    const db = firebase.firestore();
    const [session, setsession] = useState(null);
    const [sessionids, setsessionids] = useState(null);

    const site = UserProfile.getSiteType();
    const country = UserProfile.getSiteLang();
    const countryObjects = [
        {
            label: 'France',
            key: 'fr'
        },
        {
            label: 'Pays-bas',
            key: 'nl'
        },
        {
            label: 'Allemagne',
            key: 'gm'
        },
        {
            label: 'Italie',
            key: 'it'
        },
        {
            label: 'Royaume-Uni',
            key: 'uk'
        },
        {
            label: 'Etats-unis',
            key: 'us'
        },
        {
            label: 'Suède',
            key: 'sw'
        }
    ];
    const [showSignIn, setshowSignIn] = useState(true);
    const auth = firebase.auth();
    let history = useHistory();
    const [init, setinit] = useState(true);
    var loadNextSessionListener;
    var loadDaySessionListener;
    const [imageStatus, setimageStatus] = useState("loading");
    const [counter, setCounter] = useState(0);
    var timer;
    const [isConnectionSlow, setisConnectionSlow] = useState(false);
    const {t} = useTranslation('common');
    const [imageReadyToLoad, setimageReadyToLoad] = useState(false);

    useEffect(() => {
        timer = setInterval(() => {
          setCounter(counter + 0.1);
        }, 100);
        setimageReadyToLoad(true)
  
        return () => {
          clearInterval(timer);
        }
    }, [counter]);

    useEffect(() => {
        console.log("isie : " + isIE);
        if(isTablet){
            toast.info("Please play in lanscape mode.");
        }
        loadNextSession();
        //loadAudio();
        UserProfile.clearUser();
        UserProfile.setSite(UserProfile.getSiteType());
        UserProfile.setCountry(UserProfile.getSiteLang());
        auth.signOut();
        return () => {
            if (typeof loadDaySessionListener !== "undefined") { 
                // safe to use the function
                loadDaySessionListener();
            }
            if (typeof loadNextSessionListener !== "undefined") { 
                // safe to use the function
                loadNextSessionListener();
            }
        }
    }, []);

    const loadAudio = () => {
        console.log("loadAudio");
        var audioElement = document.querySelector('audio');
        console.log("audioElement");
        console.log(audioElement);
        audioElement.setAttribute('src', process.env.PUBLIC_URL + '/assets/songs/extraitjohnny1.mp3');
        audioElement.load()
        audioElement.addEventListener("load", function() { 
            audioElement.play(); 
        }, true);
    }

    const checkIfImageLoaded = () => {
        const size = 3770;
        let count = counter / 10;
        console.log("internetSpeedCounter : " + count);
        let speed = Math.round(size / count);
        console.log("speed");
        console.log(speed / 1000 + "Kb/s");
        clearInterval(timer);

        if(speed < Settings.INTERNET_SPEED_LIMIT){
            // poor connection
            //setisConnectionSlow(true);
        }
        else {
            setisConnectionSlow(false);
        }
    }

    const loadNextSession = () => {
        db.collection("sessions")
            .where("countries", "array-contains", country)
            .where("date", ">", new Date())
            .orderBy("date", "asc")
            .get()
            .then(function(querySnapshot) {
                console.log("load session");
                let tempsession = null;
                let gotSession = false;
                let currentSession = null;
                querySnapshot.forEach(function(doc) { 
                    if(doc.data().sites.indexOf(site) !== -1 && !gotSession){
                        gotSession = true;
                        tempsession = doc.data();
                        tempsession.id = doc.id;
                    }
                }); 

                if(gotSession){
                    let date = new Date(tempsession.date.toDate());
                    date = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + "T" + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":00";
                    tempsession.date = date;
                    
                    console.log("date");
                    console.log(date);
                    checkTimeReached(date);
                    
                    let changeSession = false;
                    if(UserProfile.getSessionDate()){
                        if(UserProfile.getSessionDate() !== tempsession.date){
                            changeSession = true;
                        }
                    }
                    else {
                        changeSession = true;
                    }
                    //if(changeSession){
                        UserProfile.setSessionId(tempsession.id);
                        UserProfile.setSessionDate(tempsession.date);
                        
                        currentSession = tempsession;
                        console.log(tempsession);
                        setsession(tempsession);
                        loadDaySessions(tempsession.dayId);
                    //}
                }
                else {
                    console.log("no session");
                    setsession(null);
                }

                /*
                if(currentSession !== null){
                    checkUserConnected(currentSession);
                }
                else {
                    logout();
                }
                */
            });
    }

    const loadDaySessions = (dayId) => {
        db.collection("sessions")
            .where("dayId", "==", dayId)
            .where("countries", "array-contains", country)
            .orderBy("date", "asc")
            .get()
            .then(function(querySnapshot) {
                let sessionids = [];
                querySnapshot.forEach(function(doc) {
                    if(doc.data().sites.indexOf(site) !== -1){
                        sessionids.push(doc.id);
                    }
                });
                setsessionids(sessionids);
            });
    }

    const openEvent = () => {
        setshowSignIn(true);
    }

    function parseISOLocal(s) {
        var b = s.split(/\D/);
        return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
    }

    const checkTimeReached = (date) => {
        let diff = (Date.parse(parseISOLocal(date)) - Date.parse(new Date())) / 1000;
        console.log("diff");
        console.log(diff);
        if(diff < 3600){
            setshowSignIn(true);
        }
    }

    const checkUserConnected = (currentSession) => {
        console.log("checkUserConnected reg");
        //auth.signOut();
        if(auth.currentUser !== null){
            console.log("logged in reg");
            console.log(auth.currentUser);
            // check if user still has team
            if(init){
                checkIfUserInValidTeam(auth.currentUser, currentSession);
                setinit(false);
            }
        }
        else {
            console.log("not logged in reg");
            history.push('/');
        }
        /*
        auth.onAuthStateChanged(firebaseUser => {
            if(firebaseUser){
                console.log(firebaseUser);
                // check if user still has team
                if(init){
                    checkIfUserInValidTeam(firebaseUser, currentSession);
                    setinit(false);
                }
            }
            else {
                console.log("not logged in : " + init);
                UserProfile.clearUser();
            }
        })
        */
    }

    const checkIfTeamValid = (teamId, currentSession, userId) => {
        firebase
            .firestore()
            .collection('teams')
            .doc(teamId)
            .get()
            .then(function(doc) {
                if(doc.exists){
                    if(doc.data().sessionId === currentSession.id){
                        console.log("valid team");
                        history.push('/waiting-room', { team: doc.data() });
                    }
                    else {
                        logoutAndClearUser(userId);
                    }
                }
                else {
                    logoutAndClearUser(userId);
                }
            })
            .catch(function(error) {
                console.error("Error fetching team: ", error);
            });
    }

    const logoutAndClearUser = (userId) => {
        auth.signOut();
        //clear user
        db.collection("users").doc(userId).update({
            room: firebase.firestore.FieldValue.delete(),
            team: firebase.firestore.FieldValue.delete()
        })
        .then(function() {
            console.log("logged out and user cleared")
        })
        .catch(function(error) {
            console.error("Error updating user: ", error);
        });
    }

    const logout = () => {
        auth.signOut();
    }

    const checkIfUserInValidTeam = (firebaseUser, currentSession) => {
        firebase
        .firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .get()
        .then(function(doc) {
            if(doc.exists){
                let teamId = null;
                if(doc.data().team && doc.data().sessions.indexOf(currentSession.id) !== -1){
                    teamId = doc.data().team;
                }
                if(teamId !== null){
                    checkIfTeamValid(teamId, currentSession, firebaseUser.uid)
                }
                else {
                    // assign room and team
                    logoutAndClearUser(firebaseUser.uid);
                }
            }
        })
        .catch(function(error) {
            console.error("Error fetching user: ", error);
        });
    }

    const moveToNextSession = () => {
        loadNextSession();
    }

    const timeUp = () => {
        console.log("timeUp reg");
    }
    
    function maskMovie() {
        console.log("maskMovie");
        let movieMask = document.getElementById('playMovie');
        movieMask.classList.add("d-none");
    }

    const videoEnded = () => {
        console.log("videoEnded");
        if(document.fullscreenElement){
            console.log("videoEnded2");
            document.webkitExitFullscreen();
        }
    }
    /*
    const videoEnded = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
            .then(() => console.log("Document Exited form Full screen mode"))
            .catch((err) => console.error(err));
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
            .then(() => console.log("Document Exited safari form Full screen mode"))
            .catch((err) => console.error(err));
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
            .then(() => console.log("Document Exited IE form Full screen mode"))
            .catch((err) => console.error(err));
        }
    }
    */

    const unmute = () => {
        if(document.querySelector("#player-test video")){
            if(document.querySelector("#player-test video").muted === true){
                document.querySelector("#player-test video").muted = false;
            }
        }
    }

    return !isIE ? 
        (
            !isConnectionSlow ? 
            (
                session && sessionids ? (
                    <div className="registration-page container">
                        <div className="countdown-panel">
                            <h1 className="ttr">{t('next_session_in.title')} :</h1>
                            {/*<CountdownSession key={session.id} date={session.date} openEvent={openEvent} dateReached={moveToNextSession} from="home"/>*/}
                            <CircleProgressBarRealDays key={session.id} date={session.date} timeUp={moveToNextSession} oneHourReached={openEvent} langs= {[t('days.title'), t('hours.title'), t('minutes.title'), t('seconds.title')]}/>
                            {/*
                            <Countdown key={session.id} date={session.date} dateReached={moveToNextSession} />
                            */}
                            <div className="rulesMovie">
                                <ReactPlayer 
                                    className='react-player' 
                                    width='100%' 
                                    height='100%' 
                                    controls={true} 
                                    url={process.env.PUBLIC_URL + '/assets/videos/' + Settings.RULES_VIDEO + "_" + UserProfile.getSiteType() + "_" + UserProfile.getSiteLang() + ".mp4"} 
                                    onStart={maskMovie} 
                                    onReady={maskMovie} 
                                    onEnded={videoEnded} 
                                    playing={true} 
                                    loop={false} />
                                    <div id="playMovie" className="playMovie">
                                        <button onClick={maskMovie} id="playerBtn" className="playerBtn"></button>
                                    </div>
                            </div>
                            {/*
                            <ReactJWPlayer
                                playerId={"player-test"}
                                playerScript={Settings.JW_PLAYER_SCRIPT}
                                file={process.env.PUBLIC_URL + '/assets/songs/extraitjohnny1.mp3'}
                                isAutoPlay={true}
                                isMuted={true}
                                onTime={unmute}
                            />
                            <audio controls onLoad={loadAudio}></audio>

                        */}
                        <audio src={process.env.PUBLIC_URL + '/assets/songs/extraitjohnny1.mp3'} autoPlay muted controls></audio>
                        </div>
                        {
                            showSignIn ? <RegistrationForm session={session} sessionids={sessionids} site={site} country={country} changeLoaderStatus={() => props.changeLoaderStatus()}/> : ''
                        }
                        <ToastContainer
                            position="bottom-left"
                            autoClose={10000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                        
                        {/*
                            showSignIn ? <div>
                                <h5>Champs pour simuler le choix pays/site</h5>
                                <div className="form-group">
                                    <select value={country} id="country" name="country" onChange={event => {
                                        setcountry(event.target.value);
                                        UserProfile.setCountry(event.target.value);
                                    }}>
                                        {
                                            countryObjects.map((item) => (
                                                <option key={item.key} value={item.key}>{item.label}</option>
                                            ))
                                        }
                                    </select>
                                    <label htmlFor="country">Pays</label>
                                </div>
                                <div className="form-group">    
                                    <select value={site} id="site" name="site" onChange={event => {
                                        setsite(event.target.value);
                                        UserProfile.setSite(event.target.value);
                                    }}>
                                        <option value="core">Core</option>
                                        <option value="senior">Senior</option>
                                    </select>
                                    <label htmlFor="site">Site</label>
                                </div>
                            </div> : ''
                        */}
                        
                    </div>
                ) : 
                <div className="m-auto">
                    <p>{t('no_session_planned.title')}</p>
                    {
                        imageReadyToLoad ? 
                        <img style={{display: "none"}} src={Settings.FIREBASE_STORAGE + "o/Logo-match.png?alt=media&token=68dc9338-112b-4ff8-a3ae-c072863df6dc"} onLoad={checkIfImageLoaded} />
                        : ''
                    }
                </div>
            ) : 
            <div>
                <p>{t('internet_slow.title')}</p>
            </div> 
        )
        :
        <p>IE is not supported. Download Chrome/Opera/Firefox</p>
}