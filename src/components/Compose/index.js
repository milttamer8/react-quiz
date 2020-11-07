import React, {useState, useEffect} from 'react';
import './Compose.css';
import $ from 'jquery';
import Picker from 'emoji-picker-react';
import premadeSentences from '../../settings/sentences.json';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Display the input field in chat
*/
export default function Compose(props) {
    const [message, setMessage] = useState("");
    const [sentences, setsentences] = useState(null);
    const country = UserProfile.getCountry() ;
    const chatUid = props.chatUid;
    const {t} = useTranslation('common');

    useEffect(() => {
      document.querySelector('#chat-' + chatUid + ' .emoji-picker-react').style.display = "none";
      document.querySelector('#chat-' + chatUid + ' .ready-sentences').style.display = "none";
      //loadSentences();
      return () => {
        
      }
    }, []);

    const loadSentences = () => {
      let listSentences = [];
      for (let i = 0; i < premadeSentences.length; i++) {
        if(premadeSentences[i].lang === country){
          listSentences = premadeSentences[i].sentences;
        }
        
      }
      setsentences(listSentences);
    }

    const sendMessage = e => {
      e.preventDefault();

      if(props.isBlocked === false || !props.isBlocked || props.isBlocked === null || props.isBlocked === undefined){
        if(message !== ""){
          //props.sendMessage(message.replace(/(["'])/g, "\\$1"));
          props.sendMessage(message);
          setMessage("");        
        }
      }
    };

    const onEnterPress = (e) => {
      if(e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault();
        $('#chat-' + chatUid + ' #button-send-chat').click();
        
        let contentBlock = $('#chat-' + chatUid + ' .rcs-inner-container');
        let bottomContentMsg = $('#chat-' + chatUid + ' .bottomContentMsg')

        if($(bottomContentMsg).prop('id') === 'bottomContentMsg'){
          $(contentBlock).animate({
              scrollTop: $('#chat-' + chatUid + ' #bottomContentMsg').offset().top           
            });
            $(bottomContentMsg).removeAttr('id', 'bottomContentMsg')
        }
      }
    }

    const onEmojiClick = (event, emojiObject) => {
      setMessage($('#chat-' + chatUid + ' #message-area').val() + emojiObject.emoji);
      hideEmojiPicker();
    };

    const changeEmojiPickerVisibility = () => {
      if(document.querySelector('#chat-' + chatUid + ' .emoji-picker-react').style.display === 'none'){
        document.querySelector('#chat-' + chatUid + ' .emoji-picker-react').style.display = "flex";
      }
      else {
        document.querySelector('#chat-' + chatUid + ' .emoji-picker-react').style.display = "none";
      }
    }

    const changeSentenceListVisibility = () => {
      if(document.querySelector('#chat-' + chatUid + ' .ready-sentences').style.display === 'none'){
        document.querySelector('#chat-' + chatUid + ' .ready-sentences').style.display = "flex";
      }
      else {
        document.querySelector('#chat-' + chatUid + ' .ready-sentences').style.display = "none";
      }
    }

    const hideEmojiPicker = () => {
      document.querySelector('#chat-' + chatUid + ' .emoji-picker-react').style.display = "none";
      document.querySelector('#chat-' + chatUid + ' .ready-sentences').style.display = "none";
    }

    return (
      <div className={"compose " + (props.isMobile === true && props.isLive === true ? "mobile-swipeable" : "")} id="compose-block">
        <Picker onEmojiClick={onEmojiClick} disableSearchBar={true} groupNames={{
          smileys_people: 'yellow faces'
        }} />
        <aside className="ready-sentences">
          <section className="emoji-scroll-wrapper">
            <ul className="sentence-list">
              {
                sentences ? 
                sentences.map((item, index) => (
                  <li key={index} onClick={() => setMessage(message + item)}>{item}</li>
                )) : ''
              }
            </ul>
          </section>
        </aside>
        <form className="rcw-sender" onSubmit={sendMessage}> 
            <textarea placeholder={t('message_field.title')}
            name="message" className="form-control" id="message-area" onChange={(event) => setMessage(event.target.value)} onFocus={hideEmojiPicker} onKeyDown={onEnterPress} value={message} disabled={props.isBlocked}></textarea>
            <div className="emo-icons">
              <i className="fa fa-smile-o" aria-hidden="true" onClick={() => props.isBlocked === false || !props.isBlocked || props.isBlocked === null || props.isBlocked === undefined ? changeEmojiPickerVisibility() : {}}></i>
              {/* <img className="emoji-displayer emoji" src={process.env.PUBLIC_URL + '/assets/images/avatars/emoji.png'} alt="" onClick={changeEmojiPickerVisibility} /> */}
            </div>
            <button type="submit" id="button-send-chat" className="rcw-send"><i className="sendMsg"></i></button>
        </form>
      </div>
    );
}