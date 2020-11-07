import React from 'react'
import { Link } from "react-router-dom";
import $ from 'jquery';
import {Navbar, Nav, NavDropdown} from 'react-bootstrap';
export default function index() {

    return (  
        <div className="contentNav">
            <Navbar collapseOnSelect expand="lg" id="navbar" className="navbar">
                <div className="logo">
                    <Link to="/"><img src="./assets/images/home/Logo-match.png" alt="Logo" /></Link>
                </div>
                <Navbar.Toggle className="navbar-toggler" aria-controls="collapsibleNavbar">
                    <Navmenu />
                </Navbar.Toggle>
                    
                <ToggleClass />
            </Navbar>

        </div>
    );   
    
}


class Navmenu extends React.Component {
    handleClick = () => {
      $('#navIcone').toggleClass('open');
      $('body').toggleClass('noScroll');
    }
  
    render() {
        return (
            <div onClick={this.handleClick} id="navIcone" className="menu-btn">
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
            </div>
        );
    }
}

class ToggleClass extends React.Component {
    toggleClass = () => {
        $('#navIcone').toggleClass('open');
    }
  
    render() {
      return (
        <Navbar.Collapse id="collapsibleNavbar">
            <NavDropdown title="Dating Advice">
                <div className="row">
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Dating Advice</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                </div>
            </NavDropdown>
            <Nav className="">
                <Nav.Link onClick={this.toggleClass} href="#">Events</Nav.Link>
                <Nav.Link onClick={this.toggleClass} href="#">Success Stories</Nav.Link>
            </Nav>
            <NavDropdown title="UK Dating">
                <div className="row">
                    <div className="grid">
                        <h4 className="ttr">UK Dating</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">UK Dating</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">UK Dating</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">UK Dating</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                </div>
            </NavDropdown>
            
            <NavDropdown title="Niche Dating">
                <div className="row">
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                    <div className="grid">
                        <h4 className="ttr">Niche</h4>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link href="#">Dating Advice</Nav.Link>
                        <Nav.Link href="#">Events</Nav.Link>
                        <Nav.Link href="#">Success Stories</Nav.Link>
                        <Nav.Link href="#">Uk Dating</Nav.Link>
                        <Nav.Link href="#">Niche Dating</Nav.Link>
                        <Nav.Link href="#">Free Dating</Nav.Link>
                    </div>
                </div>
            </NavDropdown>
            <Nav className="">
                <Nav.Link onClick={this.toggleClass} href="#">Free Dating</Nav.Link>
            </Nav>
        </Navbar.Collapse>
      );
    }
  }