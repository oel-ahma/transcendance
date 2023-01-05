ft_transcendence
==================
Or `how to lose friends as quick as possible`
------------------

![](https://shields.io/github/languages/top/restray/ft_transcendance)

Transcendence is a modern web project, the goal is to make an online, real-time & multiplayer pong (1972)

![Incredible, isn't it?](https://c.tenor.com/-DP-V9BpL6EAAAAC/incredible-double.gif)

This readme file will help you to correct us, or simply to use this project.

## Installation

There is actually 3 steps:
1. Get to [Your 42 Intra](https://profile.intra.42.fr/oauth/applications) to register a new API App
    1. Create a new application
    2. Give it a name (such as `ft_transcendence correction`)
    3. In the `Redirect URI` field, simply put: `http://localhost:4000/`
    4. Keep your `UID` and your `Secret` somewhere (You'll need it later)
1. Duplicate the `.env.example` and rename it `.env`. Then open it, and modify whatever you need.
1. Then you can launch docker: `docker-compose up --build`

## Usage

Basically, you can go on [localhost:4000](http://localhost:4000/) to enjoy this beautiful and clean multiplayer pong mmorpg style for boomers (*Are we sure about that chief?*).

## Authors

 - [@oel-ahma](https://github.com/oel-ahma) : has worked on the gameplay and realtime
 - [@xGoldaxe](https://github.com/xGoldaxe) : has build the frontend architecture and everything else of the frontend 
 - [@restray](https://github.com/restray) : has made the whole backend and has implement logic part & securities of the game
