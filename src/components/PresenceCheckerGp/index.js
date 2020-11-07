import React, {useEffect} from 'react';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';

/*
 *   Check for user presence and sets a listener for when the user quits the app in /game-platform
*/
export default function PresenceCheckerGp(props) {
    const uid = props.userUid;
    const teamUid = props.teamUid;
    useEffect(() => {
        console.log("team " + teamUid);
        console.log("PresenceChecker loaded ");
        userRealtimeDatabaseStatusListener();
        return () => {
        }
    }, []);

    const userRealtimeDatabaseStatusListener = () => {
        // ...
        var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid);
        var userStatusDatabaseRef = firebase.database().ref('/status/' + uid);
        var teamStatusDatabaseRef = firebase.database().ref('/status/' + teamUid);

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
                //userStatusDatabaseRef.set(isOnlineForDatabase);

                // We'll also add Firestore set here for when we come online.
                userStatusFirestoreRef.set(isOnlineForFirestore);
                teamStatusDatabaseRef.set(getUserPresenceId());
            });
        });
    }

    const getUserPresenceId = () => {
        switch (parseInt(UserProfile.getUserIdInTeam())) {
            case 1:
                return {
                    user1Time: 0
                }
            case 2:
                return {
                    user2Time: 0
                }
            case 3:
                return {
                    user3Time: 0
                }
            case 4:
                return {
                    user4Time: 0
                }
            case 5:
                return {
                    user5Time: 0
                }
            case 6:
                return {
                    user6Time: 0
                }
            case 7:
                return {
                    user7Time: 0
                }
            case 8:
                return {
                    user8Time: 0
                }
        }
    }

    return null;
}