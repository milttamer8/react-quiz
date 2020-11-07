import React from 'react';
import $ from 'jquery';
import './ProgressBar.css';

export default class ProgressBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: this.props.allottedTime,
      running: true,
    }
  }

  componentDidMount(){
    console.log("componentDidMount");
    this.handleStart();
  }
  
  componentDidUpdate(prevProps, prevState) {
    if(this.state.running !== prevState.running){
      switch(this.state.running) {
        case true:
          this.handleStart();
      }
    }
  }

  componentWillUnmount() {
    console.log("Greeting unmounted...");
    clearInterval(this.timer);
  }
  
  handleStart() {
    //let initWidth = this.props.screen - 60; 
    let initWidth = (this.props.isMobile === true) ? this.props.screen - 60 :  $('#progressBar').width();
    let allotedTime = this.props.allottedTime; 
    let targetDate = this.props.targetDate; 
    let countdown = (Date.parse(this.parseISOLocal(this.props.targetDate)) - Date.parse(new Date())) / 1000;
    this.timer = setInterval(() => {
      countdown = (Date.parse(this.parseISOLocal(targetDate)) - Date.parse(new Date())) / 1000;
      /*
      console.log(" count progress bar : " + countdown);
      console.log("allotedTime : " + allotedTime);
      console.log("initWidth : " + initWidth);
      */
      var progressBarWidth = countdown * initWidth / allotedTime;
      //console.log(" progressBarWidth : " + progressBarWidth);
      $('#progressBar').find('.bar').animate({ width: progressBarWidth }, 1000);
      //const newCount = this.state.count - 1;
      
      /*
      this.setState(
        {count: newCount >= 0 ? newCount : 0}
      );
      */
      
      if(countdown < 0){
        this.handleTimeUp();
      }
    }, 1000);
  }

  parseISOLocal(s) {
    var b = s.split(/\D/);
    return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
  }
  
  handleStop() {
    if(this.timer) {
      clearInterval(this.timer);
      this.setState(
        {running:false}
      );      
    }
  }

  handleTimeUp(){
    this.handleStop();
    this.props.timeUp();
  }
  
  render() {
    return (
      <div className="container">
        <div id="progressBar" style={{width: this.props.screen - 60}}>
          <div className="bar"></div>
        </div>
      </div>
    )
  }
}