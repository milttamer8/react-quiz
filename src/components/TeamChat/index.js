import React, {useEffect, useState} from 'react';
import MessageList from '../MessageList';
import './TeamChat.css';
import * as firebase from 'firebase';
import UserProfile from '../../session/UserProfile';
import { CSSTransition } from 'react-transition-group';
import moderation from '../../settings/moderation.json';

/*
 *   Handle the team chat
 *   Load messages
 *   Moderate new message to send
*/
export default function TeamChat(props) {
//export default React.forwardRef(function Chat(props, ref) {
    const [conversations, setConversations] = useState(null);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setmessages] = useState(null);
    const [showConversation, setshowConversation] = useState(false);
    const teamUid = props.teamUid;
    var vanishingMessageTimeout;
    useEffect(() => {
      conversationListener();
      return () => {
        console.log("team chat out");
        //removeListeners();
      }
    },[]);

    useEffect(() => {
      if(conversations){
        if(conversations[0]){
          if(conversations[0].messages == null){
            messageListener();
          }
        }
      }
    })

    const removeListeners = () => {
      firebase
        .database()
        .ref("users/" + UserProfile.getAlias() + "/chatUids")
        .off();

      firebase
        .database()
        .ref("messages/" + teamUid)
        .off();
    }

    const conversationListener = () => {
      firebase
        .database()
        .ref("users/" + UserProfile.getAlias() + "/chatUids")
        .on("value", snapshot => {
          let tempConversations = [];
          let count = 1;
          snapshot.forEach(child => {
            if(count < 2){
              UserProfile.setActiveChat(child.key);
            }
            if(!child.key.includes('_')){
              tempConversations.push({
                id: count,
                uid: child.key,
                name: child.val().name,
                photo: child.val().photo,
                isOneToOne: false
              });
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
        return item.uid === teamUid;
      });
      
      setActiveConversation(elements[0]);
      if(elements[0]){
        setmessages(elements[0].messages);
        getActiveConversation(teamUid);
      }
    }

    
    const writeMessageToDB = (chatUid, message, alias) => {
      var specialChars = /[`#^\[\]{}"\\|<>\/~]/;

      if(!specialChars.test(message)){
        console.log("test char ok");
        if(checkIfValidMessage(message)){
          console.log("test valid ok");
          if(!checkIfEmailInString(message) && !checkIfPhoneNumberInString(message)){
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

    function escapeRegExp(string){
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    const checkIfValidMessage = (message) => {
      const languages = [
        "fr", "uk", "sp", "it", "pt", "sw", "pt", "gm", "keywords"
      ];

      for (var i = 0; i < moderation.length; i++){
        if(languages.indexOf(moderation[i].lang) !== -1){
          for (let j = 0; j < moderation[i].words.length; j++) {
             //if(new RegExp("\\b" + message.toLowerCase() + "\\b").test(moderation[i].words[j])){
              var regex = '\\b';
              regex += escapeRegExp(moderation[i].words[j]);
              regex += '\\b';
              //if(message.toLowerCase().includes(moderation[i].words[j])){
              if(new RegExp(regex, "i").test(message.toLowerCase())){
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
      //var phoneno = /^\d{7}$/;
      //text = text.replace(/\s/g, '');
      //if(text.match(phoneno))
      if(text.replace( /\s|-/g, "" ).match(/^[0-9\+]{8,100}$/))
        return true;
      
      return false;
    }

    const getActiveConversation = (uid) => {
        let elements = conversations.filter(function(item){
          return item.uid === uid;
        });
        setActiveConversation(elements[0]);
        UserProfile.setActiveChat(elements[0].uid)
        setmessages(elements[0].messages);
        setshowConversation(true);
        
    }

    const sendMessage = (message) => {
      writeMessageToDB(activeConversation.uid, message, UserProfile.getAlias());
      getActiveConversation(activeConversation.uid);
    }

    const changeConversationStatus = () => {
      props.changeConversationStatus(teamUid);
    }

    return (
      <div className="messenger" id={"chat-" + teamUid}>
        {
          activeConversation && messages ? (<CSSTransition in={showConversation} timeout={500} classNames="alert" unmountOnExit>
          <div className="contentMs" id="contentMs"><MessageList isTeamChat={true} isMobile={props.isMobile} isLive={props.isLive} changeConversationStatus={changeConversationStatus} messages={messages} hideChat={() => setshowConversation(false)} conversation={activeConversation} sendMessage={sendMessage} /></div>
          </CSSTransition>) : ''
        }
      </div>
    );
  }