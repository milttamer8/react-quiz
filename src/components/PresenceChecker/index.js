import React, {useEffect, useState} from 'react';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";
/*
 *   Check for user presence and sets a listener for when the user quits the app in /waiting-room
*/
export default function PresenceChecker(props) {
    const uid = props.userUid;
    const teamUid = props.teamUid;
    const [currentUserStatus, setcurrentUserStatus] = useState(null);
    var presenceQuery;
    const {t} = useTranslation('common');
    useEffect(() => {
        console.log("team " + teamUid);
        console.log("PresenceChecker loaded ");
        userRealtimeDatabaseStatusListener();
        //userCouldFirestoreStatusListener();
        return () => {
            if (typeof presenceQuery !== "undefined") { 
                // safe to use the function
                presenceQuery();
            }
        }
    }, []);

    const userRealtimeDatabaseStatusListener = () => {
        // ...
        var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid);
        var userStatusDatabaseRef = firebase.database().ref('/status/' + uid);

        // Firestore uses a different server timestamp value, so we'll 
        // create two more constants for Firestore state.
        var isOfflineForFirestore = {
            state: 'offline',
            //last_changed: firebase.firestore.FieldValue.serverTimestamp(),
            teamUid
        };

        var isOnlineForFirestore = {
            state: 'online',
            //last_changed: firebase.firestore.FieldValue.serverTimestamp(),
            teamUid
        };

        var isOfflineForDatabase = {
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
            teamUid
        };
        
        var isOnlineForDatabase = {
            state: 'online',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
            teamUid
        };

        firebase.database().ref('.info/connected').on('value', function(snapshot) {
            if (snapshot.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                userStatusFirestoreRef.set(isOfflineForFirestore);
                return;
            };

            userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
                userStatusDatabaseRef.set(isOnlineForDatabase);

                // We'll also add Firestore set here for when we come online.
                userStatusFirestoreRef.set(isOnlineForFirestore);
            });
        });
    }

    /*
    const userCouldFirestoreStatusListener = () => {
        firebase.firestore().collection('status')
            .where('state', '==', 'online')
            .where('teamUid', '==', teamUid)
            .onSnapshot(function(snapshot) {
                snapshot.docChanges().forEach(function(change) {
                    if (change.type === 'added') {
                        notifyUserHasLeft(change.doc.id, false);
                        setUserStatusInTeam(change.doc.id, "online");
                    }
                    if (change.type === 'removed') {
                        notifyUserHasLeft(change.doc.id, true);
                        setUserStatusInTeam(change.doc.id, "offline");
                    }
                });
            });

    }
    */

    const userCouldFirestoreStatusListener = () => {
        presenceQuery = firebase.firestore().collection('status')
            .where('teamUid', '==', teamUid)
            .onSnapshot(function(snapshot) {
                console.log("snap difference presence");
                let count = 0;
                snapshot.forEach(function(doc) {
                    count++;
                });

                let tmpUsers = [];
                let countEach = 0;
                snapshot.forEach(function(doc) {
                    countEach++;
                    let item = doc.data();
                    item.id = doc.id;
                    tmpUsers.push(item);

                    if(count === countEach){
                        getStatusDifference(tmpUsers);
                    }
                });
            });
    }

    const getStatusDifference = (tmpUsers) => {
        console.log("tmpUsers");
        console.log(tmpUsers);

        /*
        let current = currentUserStatus;
        let userLeft = [];
        let userJoined = [];
        if(current){
            for (let i = 0; i < current.length; i++) {
                for (let j = 0; j < tmpUsers.length; j++) {
                    if(current[i].id === tmpUsers[i].id){
                        if(current[i].state !== tmpUsers[i].state){
                            if(tmpUsers[i].state === "offline"){
                                userLeft.push(tmpUsers[i].id);
                            }
                            else {
                                userJoined.push(tmpUsers[i].id);
                            }
                        }
                    }
                }
            }
        }
        else {
            for (let i = 0; i < tmpUsers.length; i++) {
                notifyUserHasLeft(tmpUsers[i].id, false);
                //setUserStatusInTeam(tmpUsers[i].id, "online");
                //checkForExistingNotification(tmpUsers[i].id, false);
            }
        }

        console.log("userLeft");
        console.log(userLeft);

        for (let i = 0; i < userLeft.length; i++) {
            notifyUserHasLeft(userLeft[i], true);
            //setUserStatusInTeam(userLeft[i], "offline");
            //checkForExistingNotification(userLeft[i], true);
        }
        
        for (let i = 0; i < userJoined.length; i++) {
            notifyUserHasLeft(userJoined[i], false);
            //setUserStatusInTeam(userJoined[i], "online");
            //checkForExistingNotification(userJoined[i], false);
        }
        setcurrentUserStatus(tmpUsers);
        */
        let sessionStarted = false;
        for (let i = 0; i < tmpUsers.length; i++) {
            // notifyUserHasLeft(tmpUsers[i].id, tmpUsers[i].state === "offline" ? true : false);
            if(props.from === "waiting-room"){
                /*
                if(!checkIfSessionStarted()){
                    checkForExistingNotification(tmpUsers[i].id, tmpUsers[i].state === "offline" ? true : false);
                }
                else {
                    sessionStarted = true;
                    break;
                }
                */
                checkForExistingNotification(tmpUsers[i].id, tmpUsers[i].state === "offline" ? true : false);
            }
            else {
                checkForExistingNotification(tmpUsers[i].id, tmpUsers[i].state === "offline" ? true : false);
            }
        }

        if(sessionStarted && props.from === "waiting-room"){
            console.log("p : sessionStarted");
            //props.loadIncomingSession(null);
        }
    }

    /*
    const checkForExistingNotification = (userName, hasLeft) => {
        firebase
          .database()
          .ref("messages/" + teamUid)
          .once("value").then(function(snapshot) {
                let sameMessage = null;
                snapshot.forEach(child => {
                    if(child.val().isStatusMessage === true && child.val().hasLeft === hasLeft && child.val().target === userName){
                        sameMessage = child.val().target;
                    }
                });
                if(sameMessage === null){
                    notifyUserHasLeft(userName, hasLeft);
                }
          });
    }
    */

   const checkWrIteration = (userName, hasLeft) => {
    firebase
      .database()
      .ref("messages/" + teamUid)
      .orderByChild("timestamp")
      .once("value").then(function(snapshot) {
            let count = 0;
            snapshot.forEach(child => {
                count++;
            });

            let countEach = 0;
            let isSameMessage = false;
            let lastMessageInId = 0;
            let lastMessageOutId = 0;
            snapshot.forEach(child => {
                countEach++;
                if(child.val().isStatusMessage === true && child.val().target === userName){
                    if(child.val().hasLeft === hasLeft){
                        isSameMessage = true;
                    }
                    else {
                        isSameMessage = false;
                    }

                    if(child.val().hasLeft){
                        console.log(userName + " out : " + child.val().iteration);
                        lastMessageOutId = child.val().iteration;
                    }
                    else {
                        console.log(userName + " in : " + child.val().iteration);
                        lastMessageInId = child.val().iteration;
                    }
                }

                if(countEach === count && !isSameMessage){
                    let newIteration = (hasLeft ? lastMessageOutId : lastMessageInId) + 1;
                    let id = userName + (hasLeft ? "_out": "_in") + "_" + newIteration.toString();
                    console.log("id : " + id);
                    notifyUserHasLeft(userName, hasLeft, id, newIteration);
                }
            });
      });
    }

    const checkForExistingNotification = (userName, hasLeft) => {
        
        if(props.from === "waiting-room"){
            checkWrIteration(userName, hasLeft);
        }
        else {
            /*
            firebase
            .database()
            .ref("messages/" + teamUid + "/" + id)
            .once("value").then(function(snapshot) {
                    if(snapshot.val() === null){
                        let id = userName + (hasLeft ? "_out_1": "_in_1");
                        notifyUserHasLeft(userName, hasLeft, id, 1);
                    }
            });
            */
            if(hasLeft){
                let id = userName + "_out";
                notifyUserHasLeft(userName, hasLeft, id, 0);
            }
        }
    }

    const getTeamChatNotification = (userName, hasLeft) => {
        if(hasLeft){
            return userName + " " + t('left_room.title');
        }
        else {
            return userName + " " + t('joined_room.title');
        }
    }

    function parseISOLocal(s) {
        var b = s.split(/\D/);
        return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
    }

    function calculateCountdown() {
        // let endDate = UserProfile.getSessionDate();
        let endDate = props.currentSessionDate;
        let diff = (Date.parse(parseISOLocal(endDate)) - Date.parse(new Date())) / 1000;
        return diff;
    }

    const checkIfSessionStarted = () => {
        let timeLeft = calculateCountdown();
        if(timeLeft < 1){
            return true;
        }
        return false;
    }

    const notifyUserHasLeft = (userName, hasLeft, id, iteration) => {
        console.log("notifyUserHasLeft : " + id);
        firebase
        .database()
        .ref("messages/" + teamUid + "/" + id)
        .set({
            author: "bot",
            message: getTeamChatNotification(userName, hasLeft),
            isStatusMessage: true,
            hasLeft,
            iteration,
            target: userName,
            timestamp: new Date().getTime()
        })
        .then(function() {
            console.log("notifyUserHasLeft then");
            var userDocRef = firebase.firestore().collection('users').doc(userName);
            userDocRef.update({
                status: hasLeft ? "offline" : "online"
            }).then(function() {
                console.log("user status updated");
            }).catch(function(err) {
                console.error("Error updating user status: ", err);
            });

            setUserStatusInTeam(userName, hasLeft ? "offline" : "online");
            /*
            firebase.firestore().runTransaction(function(transaction) {
                return transaction.get(userDocRef).then(function(userDoc) {
                    if (!userDoc.exists) {
                        throw "Document does not exist!";
                    }
                    
                    transaction.update(userDocRef, {
                        status: hasLeft ? "offline" : "online"
                    });
                });
            }).then(function() {
                console.log("user status updated");
            }).catch(function(err) {
                console.error("Error updating user status: ", err);
            });
            */
        });
    }

    const setUserStatusInTeam = (userName, status) => {
        var teamDocRef = firebase.firestore().collection('teams').doc(teamUid);
        firebase.firestore().runTransaction(function(transaction) {
            return transaction.get(teamDocRef).then(function(teamDoc) {
                if (!teamDoc.exists) {
                    throw "Document does not exist!";
                }

                let params = {
                    users: setStatus(teamDoc.data().users, userName, status)
                }

                if(status === "offline" && props.from === "waiting-room"){
                    // check if last online
                    // then set team active false
                    let tmpUser = teamDoc.data().users;
                    let lastOnline = true;
                    for (let i = 0; i < tmpUser.length; i++) {
                        if(tmpUser[i].status === "online" && tmpUser[i].alias !== userName){
                            lastOnline = false;
                            break;
                        }
                    }

                    if(lastOnline){
                        params.active = false;
                    }
                }
                
                transaction.update(teamDocRef, params);
            });
        }).then(function() {
          console.log("user status updated");
        }).catch(function(err) {
            console.error("Error updating user status: ", err);
        });
    }

    const setStatus = (users, userName, status) => {
        for (let i = 0; i < users.length; i++) {
          if(users[i].alias === userName){
            users[i].status = status;
            break;
          }
        }
        return users;
    }

    return null;
}