import React, {useEffect, useState} from 'react';
import MessageList from '../MessageList';
import './OneToOneChat.css';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import { CSSTransition } from 'react-transition-group';
import moderation from '../../settings/moderation.json';
import { useTranslation } from "react-i18next";
import $ from 'jquery';

/*
 *   Handle a single one to one chat
 *   Load messages
 *   Handle user blocking system
 *   Moderate new message to send
*/
export default function OneToOneChat(props) {
    const [conversations, setConversations] = useState(null);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setmessages] = useState(null);
    const [showConversation, setshowConversation] = useState(false);
    const chatUniqueId = props.chatUniqueId;
    var vanishingMessageTimeout;
    const [showBlockOptions, setshowBlockOptions] = useState(false);
    const [showUnblockBtn, setshowUnblockBtn] = useState(false);
    const {t} = useTranslation('common');
    useEffect(() => {
      conversationListener();
    },[]);

    useEffect(() => {
      if(conversations){
        if(conversations[0]){
          if(conversations[0].messages == null){
            messageListener();
          }
        }
      }
      return () => {
      }
    })

    const conversationListener = () => {
      firebase
        .database()
        .ref("users/" + UserProfile.getAlias() + "/chatUids")
        .on("value", snapshot => {
          let tempConversations = [];
          let count = 1;
          snapshot.forEach(child => {
            if(child.key.includes('_') && child.key === chatUniqueId){
              tempConversations.push({
                id: count,
                uid: child.key,
                name: child.val().name,
                photo: child.val().photo,
                gender: child.val().gender,
                isRequest: child.val().isRequest,
                isChatAccepted: child.val().isChatAccepted,
                requester: child.val().requester,
                isBlocked: child.val().isBlocked,
                initIsBlocked: child.val().initIsBlocked,
                blocker: child.val().blocker,
                blockingTime: child.val().blockingTime,
                isOneToOne: true
              });

              if(child.val().isBlocked && child.val().requester !== UserProfile.getAlias()){
                setshowBlockOptions(true);
              }
            }
            count++;
          });

          setConversations(tempConversations);
        })
    }

    const messageListener = () => {
      let tempConversations = conversations;
      // get current timestamp and remove 5 seconds
      let time = new Date();
      time.setSeconds(time.getSeconds() - 5);
      time = Date.parse(time);
      for (let i = 0; i < tempConversations.length; i++) {
        firebase
          .database()
          .ref("messages/" + tempConversations[i].uid)
          .orderByChild("timestamp")
          .on("value", messageSnapshot => {
            let tempMessages = [];
            messageSnapshot.forEach(messageChild => {
              tempMessages.push(messageChild.val());
            })
            // update message list in chat
            updateMessage(tempConversations[i].uid, tempMessages);
          })
        
          /*
        firebase
          .database()
          .ref("messages/" + tempConversations[i].uid)
          .orderByChild("timestamp")
          .startAt(time)
          .on("child_added", messageSnapshot => {
            if(messageSnapshot.val().author !== "bot" && messageSnapshot.val().author !== UserProfile.getAlias()){
                if(document.getElementById("contentMs") && tempConversations[i].uid === UserProfile.getActiveChat()){
                  //throw "Chat already open, no notification allowed";
                }
                else {
                  clearTimeout(vanishingMessageTimeout);
                  document.querySelectorAll('.vanishing-message').forEach(function(element){
                    element.style.bttom = "0";
                    element.style.display = "none";
                  });
                  document.querySelector('#chat_' + tempConversations[i].uid + ' > #vanishing-message').innerHTML = messageSnapshot.val().message;
                  let tempBulle = document.querySelector('#chat_' + tempConversations[i].uid + ' > #vanishing-message');
                  tempBulle.style.display = "block";
                  tempBulle.style.right = "40px";
                  
                  vanishingMessageTimeout = setTimeout(() => {
                    if(document.querySelector('#chat_' + tempConversations[i].uid + ' > #vanishing-message')){
                      document.querySelector('#chat_' + tempConversations[i].uid + ' > #vanishing-message').style.display = "none";
                    }
                    tempBulle.style.right = "-100%";
                  }, 3000);
                }
            }
          })
          */
      }
    }

    const updateMessage = (chatId, messages) => {
      let tempConversations = conversations;
      for (let i = 0; i < tempConversations.length; i++) {
        if(tempConversations[i].uid === chatId){
          tempConversations[i].messages = messages;
        }
      }
      setConversations(tempConversations);

      let elements = tempConversations;
      elements = elements.filter(function(item){
        return item.uid === chatUniqueId;
      });
      
      setActiveConversation(elements[0]);
      if(elements[0]){
        setmessages(elements[0].messages);
        checkShowNotificationBubble(elements[0].messages, elements[0].name, elements[0].requester);
        getActiveConversation(chatUniqueId);
      }
    }

    const checkShowNotificationBubble = (tmpMessages, chatName, requester) => {
      let lastMessageAuthor = tmpMessages[tmpMessages.length - 1].author;
      console.log("chatName : " + chatName);
      if((lastMessageAuthor !== UserProfile.getAlias() && lastMessageAuthor !== "bot") || (lastMessageAuthor === "bot" && requester !== UserProfile.getAlias())){
        if($("#chat-dot-" + chatName)){
          $("#chat-dot-" + chatName).removeClass('d-none');
        }
      }
      else {
        if($("#chat-dot-" + chatName)){
          $("#chat-dot-" + chatName).addClass('d-none');
        }
      }
    }

    
    const writeMessageToDB = (chatUid, message, alias) => {
      //var specialChars = /[`!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~]/;
      var specialChars = /[`#^\[\]{}"\\|<>\/~]/;

      if(!specialChars.test(message)){
        console.log("test char ok");
        if(checkIfValidMessage(message)){
          console.log("test valid ok");
          if(!checkIfEmailInString(message)){
            firebase
            .database()
            .ref("messages/" + chatUid)
            .push({
              author: alias,
              photo: UserProfile.getAvatar(),
              message: message,
              timestamp: new Date().getTime()
            })
          }
        }
      }
    }

    function escapeRegExp(string){
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
    

    /*
    const writeMessageToDB = (chatUid, message, alias) => {
      var specialChars = /[`!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~]/;

      let writable = true;
      if(!specialChars.test(message)){
        if(!checkIfValidMessage(message)){
          writable = false; 
        }
        else {
          if(chatUid.includes("team")){
            if(checkIfEmailInString(message) || checkIfPhoneNumberInString(message)){
              writable = false; 
            }
          }
        }
      }

      if(writable){
        firebase
        .database()
        .ref("messages/" + chatUid)
        .push({
          author: alias,
          photo: UserProfile.getAvatar(),
          message: message,
          timestamp: new Date().getTime()
        })
        
      }
    }
    */

    const checkIfValidMessage = (message) => {
      const languages = [
        "fr", "uk", "sp", "it", "pt", "sw", "pt", "gm", "keywords"
      ];

      for (var i = 0; i < moderation.length; i++){
        if(languages.indexOf(moderation[i].lang) !== -1){
          for (let j = 0; j < moderation[i].words.length; j++) {
              var regex = '\\b';
              regex += escapeRegExp(moderation[i].words[j]);
              regex += '\\b';
              //if(message.toLowerCase().includes(moderation[i].words[j])){
              if(new RegExp(regex, "i").test(message.toLowerCase())){
                console.log("mess : " + message.toLowerCase());
                console.log("mess2 : " + moderation[i].words[j]);
                return false;
             }         
          }
        }
      }
      return true;
    }

    function checkIfEmailInString(text) { 
      var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
      return re.test(text);
    }

    function checkIfPhoneNumberInString(text)
    {
      if(text.replace( /\s|-/g, "" ).match(/^[0-9\+]{8,100}$/))
        return true;
      
      return false;
    }

    const getActiveConversation = (uid) => {
        let elements = conversations.filter(function(item){
          return item.uid === uid;
        });
        setActiveConversation(elements[0]);
        setmessages(elements[0].messages);
        setshowConversation(true);
        
    }

    const sendMessage = (message) => {
      writeMessageToDB(activeConversation.uid, message, UserProfile.getAlias());
      getActiveConversation(activeConversation.uid);
    }

    const changeConversationStatus = () => {
      props.changeConversationStatus(chatUniqueId);
    }

    const changeRequestStatus = (isChatAccepted) => {
      var postData = {
        isRequest: false,
        isChatAccepted,
        initIsBlocked: false
      };
      firebase.database().ref('/users/' + UserProfile.getAlias() + '/chatUids/' + activeConversation.uid).update(postData);
      firebase.database().ref('/users/' + activeConversation.name + '/chatUids/' + activeConversation.uid).update(postData);
    }

    const changeBlockStatus = (isBlocked) => {
      var postData = {
        isBlocked,
        blocker: UserProfile.getAlias(),
        blockingTime: isBlocked ? new Date().getTime() : null
      };
      firebase.database().ref('/users/' + UserProfile.getAlias() + '/chatUids/' + activeConversation.uid).update(postData);
      firebase.database().ref('/users/' + activeConversation.name + '/chatUids/' + activeConversation.uid).update(postData);
      if(!isBlocked){
        setshowBlockOptions(false);
      }
    }

    const changeBlockOption = () => {
      if(activeConversation.isBlocked && activeConversation.blocker === UserProfile.getAlias()){
        setshowUnblockBtn(true);
      }
      else {
        setshowUnblockBtn(false);
      }
      setshowBlockOptions(true);
    }

    const CloseButton = () => {
      return <span className="close" onClick={() => setshowBlockOptions(false)}></span>
    }

    return (
      <div className="messenger" id={"chat-" + chatUniqueId}>
        {
          activeConversation && messages ? (
              <CSSTransition in={showConversation} timeout={500} classNames="alert" unmountOnExit>
                <div className="contentMs" id="contentMs">
                  {
                    activeConversation.isRequest || !showBlockOptions ? '' : 
                    (
                      activeConversation.isBlocked ? 
                      (
                        activeConversation.blocker === UserProfile.getAlias() ? 
                        (
                          showUnblockBtn ? 
                          <div className="blocking-status-container">
                              <div className="blocking-status block-btn" onClick={() => changeBlockStatus(false)}>
                                <p className="para">{t('unblock.title')} {activeConversation.name}</p>
                              </div>
                              <CloseButton />
                          </div>
                          :
                          <div className="blocking-status-container">
                              <div className="blocking-status">
                                <p className="para">{activeConversation.name} {t('can_no_longer.title')} </p>
                                <p className="para">{t('can_click.title')} {activeConversation.gender === "male" ? t('him.title') : t('her.title')}.</p>
                              </div>
                              <CloseButton />
                          </div>
                        )
                        :
                        <div className="blocking-status-container">
                            <div className="blocking-status">
                              {
                                UserProfile.getCountry() === "fr"?
                                <p className="para">{activeConversation.name} {t('blocked_this_chat.title')}</p>
                                : 
                                <p className="para">{activeConversation.name} {t('blocked_this_chat.title')} {activeConversation.gender === "male" ? "him" : "her"} {t('messages.title')}.</p>
                              }
                            </div>
                            <CloseButton />
                        </div>
                      )
                      : 
                      <div className="blocking-status-container">
                          <div className="blocking-status block-btn" onClick={() => changeBlockStatus(true)}>
                            <p className="para">{t('block.title')} {activeConversation.name}</p>
                          </div>
                          <CloseButton />
                      </div>
                    )
                  }
                  <MessageList isTeamChat={false} isMobile={props.isMobile} isLive={props.isLive} changeConversationStatus={changeConversationStatus} messages={messages} hideChat={() => setshowConversation(false)} conversation={activeConversation} sendMessage={sendMessage} changeRequestStatus={changeRequestStatus} changeBlockOption={changeBlockOption} />
                </div>
              </CSSTransition>
          ) 
          : ''
        }
      </div>
    );
  }