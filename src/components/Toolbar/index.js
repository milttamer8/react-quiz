import React from 'react';
import UserProfile from '../../session/UserProfile';
import './Toolbar.css';

/*
 *   Display chat toolbar
*/
export default function Toolbar(props) {
    const { title, leftItems, rightItems } = props;
    return (
      <div className="toolbar">
        <h1 className="toolbar-title">{ title }
          {
            props.isTeamChat === true ? '' : 
            (
              props.conversation.blocker !== UserProfile.getAlias() && props.conversation.isBlocked ? 
              ''
              :
              <div className="left-items" onClick={() => props.changeBlockOption()}>{ leftItems }</div>
            )
          }
        </h1>
        
        <div className="right-items">{ rightItems }</div>
      </div>
    );
}