import React, {useEffect} from 'react';
import moment from 'moment';
import './Message.css';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Display a single message item in the chat
*/
export default function Message(props) {
    const {t} = useTranslation('common');
    const {
      data,
      isMine,
      startsSequence,
      endsSequence,
      showTimestamp,
      photo,
      chatUid
    } = props;

    const friendlyTimestamp = moment(data.timestamp).format('LLLL');
    const MessageText = () => {
      let text = data.message;
      if(data.isAnswer){
        if(data.isAnswer === true){
          if(data.isLeader){
            if(data.isLeader){
              return t('the_leader.title') + text;  
            }
          }
          if(data.author === UserProfile.getAlias()){
            return t('you_upper.title') + text.replace("a répondu", "avez répondu");
          }
          else {
            return data.author + text; 
          }
        }
      }
      return text;
    }

    useEffect(() => {
      if(document.querySelector("#chat-"+ chatUid +" .rcs-inner-container")){
        document.querySelector("#chat-"+ chatUid +" .rcs-inner-container").scrollTop = document.querySelector("#chat-"+ chatUid +" .rcs-inner-container").scrollHeight;
      }
      return () => {
        
      }
    }, [])

    return (
      <div className={[
        'message',
        `${isMine ? 'mine' : ''}`,
        `${startsSequence ? 'start' : ''}`,
        `${endsSequence ? 'end' : ''}`
      ].join(' ')}>
      {
        showTimestamp &&
        <div className="timestamp">
        <p className="para">{ friendlyTimestamp }</p>
        </div>
      }
      
        <div className="bubble-container">
          {
            data.isAnswer || data.isStatusMessage ? '' : 
            <div>
              <img className="avatar" src={process.env.PUBLIC_URL + '/assets/images/avatars/' + photo} alt=""/>
            </div>
          }
          <div className="resume">
            {
              data.isAnswer || data.isStatusMessage ? '' : 
              <h2 className="nameUser">
                {isMine ? (startsSequence ? t('you_upper.title') : "") : data.author}
              </h2>
            }
            <div className={"bubble" + (data.isAnswer ? " is-answer" : "") + (data.author === "bot" ? " is-bot" : "") + (data.isLeader ? " is-leader" : "")} title={friendlyTimestamp}>            
              <MessageText />
            </div>
          </div>
          
          
        </div>
      </div>
      );
    }
    