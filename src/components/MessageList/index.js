import React, {useState, useEffect} from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import CustomScroll from 'react-custom-scroll';

import './MessageList.css';
import UserProfile from '../../session/UserProfile';
import * as firebase from 'firebase';
import { useTranslation } from "react-i18next";

/*
 *   Loads chat message list
 *   Display message list and input field
*/
export default function MessageList(props) {
  const MY_USER_ID = UserProfile.getAlias();
  const [ischatblocked, setischatblocked] = useState(false);
  const {t} = useTranslation('common');
  const site = UserProfile.getSite();

  useEffect(() => {
    //loadComplaints();
    return () => {}
  })

  const renderMessages = (tempMessages) => {
    let i = 0;
    let messageCount = tempMessages.length;
    let tempMessagesArray = [];

    while (i < messageCount) {
      let previous = tempMessages[i - 1];
      let current = tempMessages[i];
      let next = tempMessages[i + 1];
      let isMine = current.author === MY_USER_ID;
      let currentMoment = moment(current.timestamp);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = false;
      let photo = tempMessages[i].photo;

      if (previous) {
        let previousMoment = moment(previous.timestamp);
        let previousDuration = moment.duration(currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.author === current.author;
        
        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.timestamp);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.author === current.author;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }

      if(current.author === "bot" && props.isTeamChat === false){
        //console.log("o2o bot hidden");
      }
      else {
        if(props.isTeamChat === false && props.conversation.blocker !== UserProfile.getAlias() && props.conversation.isBlocked === true && props.conversation.blockingTime !== null && current.timestamp > props.conversation.blockingTime){
          // skip message on blocked user side
        }
        else {
          tempMessagesArray.push(
            <Message
            key={i}
            isMine={isMine}
            startsSequence={startsSequence}
            endsSequence={endsSequence}
            showTimestamp={showTimestamp}
            data={current}
            photo={current.author !== "bot" ? photo : "bot.png"}
            chatUid={props.conversation.uid}
            />
          )
        }
      }

      // Proceed to the next message.
      i += 1;
    }

    return tempMessagesArray;
  }

  const sendMessage = (message) => {
    props.sendMessage(message);
  }

  const loadComplaints = () => {
    // get chat id
    let activeChat = UserProfile.getActiveChat();
    let userId = activeChat;
    if(activeChat.includes("_")){
      let list = activeChat.split("_");
      userId = (list[0] === MY_USER_ID) ? list[1] : list[0];
      firebase.firestore().collection("complaints")
        //.where("accused", "in", [MY_USER_ID, userId])
        .where("complainant", "in", [MY_USER_ID, userId])
        .get()
        .then(function(querySnapshot) {
            if(!querySnapshot.empty){
              setischatblocked(true);
            }
            else {
              setischatblocked(false);
            }
        });
    }
    else {
      setischatblocked(false);
    }
    
}


    // function reduceChatContent() {
    //   let contentChat = document.getElementById('contentMs');
    //   let messageListContainer = document.getElementsByClassName('message-list-container');
    //   let composeBlock = document.getElementById('compose-block');

    //   contentChat.classList.add("h-auto");
    //   messageListContainer.classList.add("d-none");
    //   composeBlock.classList.add("d-none");
    // }

    return(
      <div className="message-list">
        {
          (props.isTeamChat === true && props.isMobile === false) || (props.isLive === true && props.isMobile === true) ? 
          '' :
          <div className="headerModal">        
              <button className="close" type="button" onClick={() => props.changeConversationStatus()}></button>
          </div>
        }
        {
          props.isLive === false ? 
          <Toolbar
            title={props.conversation.name}
            rightItems={[
              <ToolbarButton key="reduce" icon="reduce" />
            ]}
            changeBlockOption={() => {
              if(props.isTeamChat === false){
                props.changeBlockOption()
              }
            }}
            isTeamChat={props.isTeamChat}
            conversation={props.conversation}
          />
          : ''
        }

        <div className="message-list-container">
            {
                props.isTeamChat ? 
                <CustomScroll keepAtBottom={true} heightRelativeToParent="100%">
                  {renderMessages(props.messages)}
                  <div className="bottomContentMsg" id="bottomContentMsg"></div>
                </CustomScroll> : 
                (
                  props.conversation.isRequest ? 
                    (
                      props.conversation.requester !== UserProfile.getAlias() ? 
                      <div className="chat-request">
                          <p className="para">{t('hi.title')} {UserProfile.getAlias()}, </p>
                          <p className="para">{props.conversation.name} {t('wants_chat.title')}</p>
                          <div className="cta-chat-request">
                            <button onClick={() => props.changeRequestStatus(true)} className="chat-accept btn btn-primary">{t('accept.title')}</button>
                            <button onClick={() => props.changeRequestStatus(false)} className="chat-ignore btn btn-secondary">{t('ignore.title')}</button>
                          </div>
                      </div> 
                      : 
                      <CustomScroll keepAtBottom={true} heightRelativeToParent="100%">
                        {renderMessages(props.messages)}
                        <div className="bottomContentMsg" id="bottomContentMsg"></div>
                      </CustomScroll>
                    )
                  : 
                  (
                    props.conversation.isChatAccepted ? 
                      <CustomScroll keepAtBottom={true} heightRelativeToParent="100%">
                        {renderMessages(props.messages)}
                        <div className="bottomContentMsg" id="bottomContentMsg"></div>
                      </CustomScroll>
                    : 
                      <div className="chat-request">
                        {
                          props.conversation.requester !== UserProfile.getAlias() ? 
                          <p className="para">You ignored the chat request from {props.conversation.requester}</p>
                          :
                          <p className="para">Your chat request with {props.conversation.requester} has been ignored.</p>
                        }
                          
                      </div> 
                  )
                )
            }
        </div>

        {
          props.isMobile === true && props.isLive === true ? 
          <hr className={site === "core" ? "co" : "sr"} id="icon-swiper" />
          : ''
        }

        <Compose chatUid={props.conversation.uid} isMobile={props.isMobile} isLive={props.isLive} sendMessage={sendMessage} isBlocked={props.conversation.initIsBlocked === true && props.conversation.requester !== UserProfile.getAlias() ? true : (props.conversation.blocker !== UserProfile.getAlias() ? props.conversation.isBlocked : false)} />
      </div>
    );
}