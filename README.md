# Project 2

CS50: Web Programming with Python and JavaScript

_This repository is the source code for Flack chat web application_

## Username

User can enter a display name at the /username route page which will be associated with all of their messages throughout the session.
If another user with same username is already logged in an red alert will be shown
The required html and javascript is in templates/login.html
The styling of entire website is done in static/style.css

## Chat Page

The html is in templates/index.html
Javascript is in static/index.js
This page cannot be accessed without login and will be redirected to username page. This is implemented decor.py function @login*required
On successful login users will be sent to the chat page
They will be on the default channel Welcome which is a read only channel for system messages
Usage and features of Flack will be explained by the user \_WelcomeBot*

## Features

<b>These are the features of Flack: </b>
On top left side, users can see their display name which will be visible to others
Channels can be created and Channels list accessed from the left sidebar
Messages can be seen on the right side
Messages can be sent using the send box at the bottom of the messages section
100 most recent messages will only be remembered and shown
If users accidentally close the Flack tab without logging out, their session and the channel on which they were will be still remembered
users can log out by selecting Logout on the top right side

## Personal Touch

Messages sent by users can be deleted if necessary by right clicking on their own message and selecting delete from the context menu
Users can see new users who have logged in in the Welcome channel
Users will be notified of entry and exit of other users in their current channel

Deployment at [_flack-ma.herokuapp.com_](https://flack-ma.herokuapp.com)

