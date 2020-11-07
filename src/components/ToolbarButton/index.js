import React from 'react';
import './ToolbarButton.css';

/*
 *   Display chat toolbar button
*/
export default function ToolbarButton(props) {
    const { icon } = props;
    return (
      <i className={`toolbar-button ${icon}`} />
    );
}