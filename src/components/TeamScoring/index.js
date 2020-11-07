import React, {useEffect, useState} from 'react';
import './TeamScoring.css';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import CountdownSession from '../CountdownSession';
import { useTranslation } from "react-i18next";

/*
 *   Part of FinaleRanking
 *   Display "end of the game" CTAs
*/
export default function TeamScoring(props) {
  const db = firebase.firestore();
  const sessionId = UserProfile.getSessionId();
  const [allTeamSessionDone, setallTeamSessionDone] = useState(false);
  var teamQuery;
  const {t} = useTranslation('common');

  useEffect(() => {
    getAllTeamSessionStatus();
    return () => {
      teamQuery();
    }
  }, []);

  const getAllTeamSessionStatus = () => {
    teamQuery = db.collection('teams')
      .where('sessionId', '==', sessionId)
      .where('roomId', '==', UserProfile.getRoom())
      .onSnapshot(function(queryTeamSnapshot) {
        let allReady = true;
        queryTeamSnapshot.forEach(function(doc) {
          if(!doc.data().sessionDone){
            allReady = false;
          }
        });
        if(allReady){
          setallTeamSessionDone(true);
        }
      });
  }

  const sessionBegin = () => {
    props.leaveGameRoom();
  }

  return (
      <div className="ranking">
        <div className="leader-message">
          <h3 className="sttr subtitle">{t('new_game_in.title')}</h3>
        </div>
        {/*<CountdownSession date={props.nextSessionDate} dateReached={sessionBegin} from="waiting-room"/>*/}

        <div className="statement">
          <h3 className="ttr">{t('what_like_do.title')} :</h3>
        </div>
        <div className="w-100">
          <button className="btn btn-primary btn-feedback" onClick={() => props.endSession(true)}><strong>{t('continue_playing.title')}</strong></button>
        </div>
        {/*
          allTeamSessionDone ? 
          (
            <div className="w-100">
              <button className="btn btn-primary btn-feedback" onClick={() => props.endSession(true)}><strong>{t('continue_playing.title')}</strong></button>
            </div>
          )
          : <p className="para">{t('teams_playing.title')}..</p>
          */}
        
      </div>
  )
}