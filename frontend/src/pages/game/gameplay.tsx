//must return an array of every element that must be cleaned up
//receive the socket, if socket restart, game is reloaded

import { updateGameFromStep, updateGameStateFromServer } from "./getNextFrame";

const upperBound: number = -50;
const lowerBound: number = 50;
const padHeight: number = 30;

function createElem(direction: string, isMainPlayer = false, padHeight = 30) {
    const ballRadius: number = 1;
    const padWidth: number = 2;

    var createElem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
    );
    if (direction === 'ball') {
        var createBall = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle'
        );

        createBall.setAttribute('cy', '50%');
        createBall.setAttribute('cx', '50%');
        createBall.setAttribute('r', `${ballRadius}%`);
        createBall.setAttribute('fill', `black`);
        return createBall;
    }
    if (direction === 'scoreLeft' || direction === 'scoreRight') {
        var createScore = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        );

        createScore.setAttribute('y', `95%`);
        if (direction === 'scoreLeft') createScore.setAttribute('x', `40%`);
        else createScore.setAttribute('x', `56%`);
        createScore.setAttribute(
            'font-family',
            `"Courier New", Courier, monospace;`
        );
        createScore.setAttribute('font-size', `400%`);
        createScore.setAttribute('fill', `black`);
        createScore.textContent = '0';
        return createScore;
    } else {
        if (direction === 'left') createElem.setAttribute('x', '5%');
        else createElem.setAttribute('x', `${95 - padWidth}%`);
        createElem.setAttribute('y', `${50 - padHeight / 2}%`);
        createElem.setAttribute('width', `${padWidth}%`);
        createElem.setAttribute('height', `${padHeight}%`);
        if (isMainPlayer)
            createElem.setAttribute('fill', `#bae1ff`);
        else
            createElem.setAttribute('fill', `#ffb3ba`);
    }
    return createElem;
}

export interface GameState {
    padY: number;
    OpponentPadY: number;
    ballX: number;
    ballY: number;
    speedX: number;
    speedY: number;
    score: number[];
    date: Date;
    side: string;
    timeInterval: number;
    gameStart: boolean;
    direction: string | null;
}



export function player(gameRef: any[], current: any) {
    const side = (current.context.playerId === current.context.gameState.players.left.connected.id ? 'left' : 'right');
    var gameState: GameState = {
        padY: current.context.gameState.players[side].position.x,
        OpponentPadY: current.context.gameState.players[side === 'left' ? 'right' : 'left'].position.x,
        ballX: current.context.gameState.ball.position.x,
        ballY: current.context.gameState.ball.position.y,
        speedX: current.context.gameState.ball.vector.x,
        speedY: current.context.gameState.ball.vector.y,
        score: [current.context.gameState.players.left.points, current.context.gameState.players.right.points],
        date: new Date(),
        timeInterval: 0,
        side: side,
        gameStart: false,
        direction: null,
    };
    const socket = current.context.socket

    function touchstartUp(e: any) {
        gameState.direction = 'up';
    }
    function touchendUp(e: any) {
        if (gameState.direction === 'up') gameState.direction = null;
    }
    function touchstartDown(e: any) {
        gameState.direction = 'down';
    }
    function touchendDown(e: any) {
        if (gameState.direction === 'down') gameState.direction = null;
    }

    var mapPlayers: any[] = [];
    gameRef.forEach((ref) => {
        var svgRef = ref.ref.querySelector('svg');

        var leftPlayer = createElem('left', side === 'left', current.context.gameState.padHeight);
        leftPlayer.classList.add('gameArena--leftPlayer');
        var rightPlayer = createElem('right', side === 'right', current.context.gameState.padHeight);
        rightPlayer.classList.add('gameArena--rightPlayer');

        var ball = createElem('ball');
        ball.classList.add('gameArena--ball');

        var scoreLeft = createElem('scoreLeft');
        scoreLeft.classList.add('gameArena--scoreLeft');
        var scoreRight = createElem('scoreRight');
        scoreRight.classList.add('gameArena--scoreRight');

        svgRef.appendChild(leftPlayer);
        svgRef.appendChild(rightPlayer);
        svgRef.appendChild(ball);
        svgRef.appendChild(scoreLeft);
        svgRef.appendChild(scoreRight);

        if (ref.mobileControl) {
            var leftPad = document.createElement('div');
            leftPad.className = 'padLeft';
            ref.ref.appendChild(leftPad);
            leftPad.addEventListener('touchstart', touchstartUp);
            leftPad.addEventListener('touchend', touchendUp);
            leftPad.addEventListener('click', stopPropagation);

            var rightPad = document.createElement('div');
            rightPad.className = 'padRight';
            ref.ref.appendChild(rightPad);
            rightPad.addEventListener('touchstart', touchstartDown);
            rightPad.addEventListener('touchend', touchendDown);
            rightPad.addEventListener('click', stopPropagation);

            mapPlayers.push({leftPlayer, rightPlayer, ball, scoreRight, scoreLeft, rightPad, leftPad});
        }
        else
            mapPlayers.push({leftPlayer, rightPlayer, ball, scoreRight, scoreLeft});

        //first render
        mapPlayers.forEach((elements: any) => {
            elements[
                `${side}Player`
            ].style.transform = `translateY(${gameState.padY}%)`;
        });
        mapPlayers.forEach((elements: any) => {
            elements[
                `${side === 'left' ? 'right' : 'left'}Player`
            ].style.transform = `translateY(${gameState.OpponentPadY}%)`;
        });
    });

    var root = document.getElementById('root');
    if (!root) return;

    function stopPropagation(e: any) {
        e.stopPropagation();
    }

    function keyUp(event: any) {
        if (gameState.direction === 'down' && event.keyCode === 68)
            gameState.direction = null;
        if (gameState.direction === 'up' && event.keyCode === 65)
            gameState.direction = null;
    }

    function keyDown(event: any) {
        if (event.keyCode === 68) {
            gameState.direction = 'down';
        } else if (event.keyCode === 65) {
            gameState.direction = 'up';
        }
    }

    //their we emit event ( set a function for direction / setDirection )
    if (current.matches('connected.room')) {
        root.addEventListener('keydown', keyDown);
        root.addEventListener('keyup', keyUp);
    }

    socket.on('heartbeat', (game: any) => {
        gameState = updateGameStateFromServer(
            gameState,
            game,
            current.context.playerId
        );
    });

    socket.on('start', (game: any) => {
        gameState.score = [game.players.left.points, game.players.right.points];

        mapPlayers.forEach((elements: any) => {
            elements.scoreLeft.textContent = gameState.score[0].toString();
            elements.scoreRight.textContent = gameState.score[1].toString();
        });
    });

    socket.on('ballMove', (ball: any) => {
        gameState.ballX = ball.position.x;
        gameState.ballY = ball.position.y;

        mapPlayers.forEach((elements: any) => {
            elements.ball.style.transform = `translate(${gameState.ballX}%, ${gameState.ballY}%)`;
        });
    });

    socket.on('playerMove', (side: any, position: any) => {
        if (side !== gameState.side) {
            gameState.OpponentPadY = position;

            mapPlayers.forEach((elements: any) => {
                elements[
                    `${side}Player`
                ].style.transform = `translateY(${gameState.OpponentPadY}%)`;
            });
        }
        
        if (side === gameState.side) {
            gameState.padY = position;

            mapPlayers.forEach((elements: any) => {
                elements[
                    `${side}Player`
                ].style.transform = `translateY(${gameState.padY}%)`;
            });
        }
    });

    var interval = setInterval(() => {
        if (gameState.direction === 'down') {
            gameState.padY += 1;
            gameState.padY =
                gameState.padY > lowerBound - padHeight / 2 - 5
                    ? lowerBound - padHeight / 2 - 5
                    : gameState.padY;
            if (current.matches('connected.room')) {
                socket.emit('move', {
                    room: current.context.gameState.id,
                    position: '' + gameState.padY,
                });
            }
        } else if (gameState.direction === 'up') {
            gameState.padY -= 1;
            gameState.padY =
                gameState.padY <= upperBound + padHeight / 2 + 5
                    ? upperBound + padHeight / 2 + 5
                    : gameState.padY;
            if (current.matches('connected.room')) {
                socket.emit('move', {
                    room: current.context.gameState.id,
                    position: '' + gameState.padY,
                });
            }
        }
        gameState = updateGameFromStep(gameState);
		//render
        mapPlayers.forEach((elements: any) => {
            elements[
                `${gameState.side}Player`
            ].style.transform = `translateY(${gameState.padY}%)`;
            elements.scoreLeft.textContent = gameState.score[0].toString();
            elements.scoreRight.textContent = gameState.score[1].toString();
        });
    }, 1)

    return ()=>{
        socket.removeListener('heartbeat')
        socket.removeListener('start')
        socket.removeListener('ballMove')
        socket.removeListener('playerMove')
        if (root) {
            root.removeEventListener('keydown', keyDown)
            root.removeEventListener('keyup', keyUp)
        }
        clearInterval(interval)
        mapPlayers.forEach((map: any) => {
            const {leftPlayer, rightPlayer, ball, scoreRight, scoreLeft, leftPad, rightPad} = map
            leftPlayer.remove()
            rightPlayer.remove()
            ball.remove()
            scoreRight.remove()
            scoreLeft.remove()

            if (leftPad && rightPad) {
                leftPad.removeEventListener('touchstart', touchstartUp)
                leftPad.removeEventListener('touchend', touchendUp)
                leftPad.removeEventListener('click', stopPropagation)
                rightPad.removeEventListener('touchstart', touchstartDown)
                rightPad.removeEventListener('touchend', touchendDown)
                rightPad.removeEventListener('click', stopPropagation)
                
                leftPad.remove()
                rightPad.remove()
            }
        });
    };
}