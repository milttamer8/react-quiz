import { Component } from 'react'

/*
 *   Utilisé dans BlindTest
 *   Doit être autoplay
 *   Problème: autoplay ne marche pas dans safari.
*/
export class AudioPlayer extends Component {
    constructor(props){
        super(props);
        this.state = {
            playing: false,
            audio : new Audio(process.env.PUBLIC_URL + '/assets/songs/' + this.props.fileName)
        }
    }

    componentDidMount(){
        //this.state.playing ? this.state.audio.play() : this.state.audio.pause();
        console.log("AudioPlayer componentDidMount : " + this.state.playing);
        if(this.state.playing){
            this.state.audio.play().then(() => console.log("play success")).catch(error => {
                console.log("error");
                console.log(error);
            });
            console.log("song played");
        }
    }

    toggle(){
        this.setState({
            playing: !this.state.playing
        })
    }

    pause(){
        console.log("pausee");
        this.state.audio.pause();
    }

    play(){
        console.log("play");
        this.state.audio.play().then(() => console.log("play success")).catch(error => {
            console.log("error");
            console.log(error);
        });
        console.log("song played");
    }

    render() {
        return null
    }
}

export default AudioPlayer

