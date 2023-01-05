import { GameState } from "./gameplay";

const upperBound: number = -50;
const leftBound: number = -50;
const lowerBound: number = 50;
const rightBound: number = 50;
const ballRadius: number = 1;
const padHeight: number = 30;
const padWidth: number = 2;
const leftPadFrontBoundary: number = -43;
const rightPadFrontBoundary: number = 43;
const maxSpeed: number = 1;


export function updateGameStateFromServer(
    gameState: GameState,
    newGameState: any,
    thisPlayerID: number
) {
    var newState: GameState = {
        padY: gameState.padY,
        OpponentPadY: gameState.OpponentPadY,
        side:
            thisPlayerID === newGameState.players.left.connected.id
                ? 'left'
                : 'right',
        ballX: newGameState.ball.position.x,
        ballY: newGameState.ball.position.y,
        speedX: newGameState.ball.vector.x,
        speedY: newGameState.ball.vector.y,
        score: [newGameState.players.left.points, newGameState.players.right.points],
        gameStart: newGameState.status === 'start' ? true : false,
        date: gameState.date,
        timeInterval: gameState.timeInterval,
        direction: gameState.direction,
    };
    return newState;
}

export function updateGameFromStep(gameState: GameState): GameState {
    //time
    var newState: GameState = {...gameState};
    var {
        padY,
        OpponentPadY,
        ballX,
        ballY,
        speedX,
        speedY,
        score,
        date,
        timeInterval,
        side,
        gameStart,
        direction,
    } = newState;

    // calcule next position from last state, create a reducer gameState = nexGameState(gameState)
    if (gameStart === true) {
        //Upper&LowerBoundaries
        if (ballY + ballRadius > lowerBound || ballY - ballRadius < upperBound)
            speedY *= -1;
        //Player paddleHitManagement
        if (
            Math.floor(ballX) === leftPadFrontBoundary &&
            ballY < padY + padHeight / 2 &&
            ballY > padY - padHeight / 2
        ) {
            speedX *= -1.1;
            if (ballY > padY - padHeight / 4 && ballY < padY + padHeight / 4)
                //paddleMiddleSegement (180°)
                speedY *= -1.1;
            else if (
                ballY < padY + padHeight / 2 &&
                ballY > padY + padHeight / 4
            )
                //paddleLowerSegement (45°)
                speedY = Math.abs(speedX);
            else if (
                ballY > padY - padHeight / 2 &&
                ballY < padY - padHeight / 4
            )
                //paddleUpperSegement (45°)
                speedY = -Math.abs(speedX);
        }
        //Opponent paddleHitManagement
        if (
            Math.floor(ballX) + ballRadius === rightPadFrontBoundary &&
            ballY < OpponentPadY + padHeight / 2 &&
            ballY > OpponentPadY - padHeight / 2
        ) {
            speedX *= -1.1;
            if (
                ballY > OpponentPadY - padHeight / 4 &&
                ballY < OpponentPadY + padHeight / 4
            )
                //paddleMiddleSegement (180°)
                speedY *= -1.1;
            else if (
                ballY < OpponentPadY + padHeight / 2 &&
                ballY > OpponentPadY + padHeight / 4
            )
                //paddleLowerSegement (45°)
                speedY = Math.abs(speedX);
            else if (
                ballY > OpponentPadY - padHeight / 2 &&
                ballY < OpponentPadY - padHeight / 4
            )
                //paddleUpperSegement (45°)
                speedY = -Math.abs(speedX);
        }
        //Player paddleSidesHitManagement
        if (
            (Math.floor(ballY + ballRadius) ===
                Math.floor(padY - padHeight / 2) ||
                Math.floor(ballY - ballRadius) ===
                    Math.floor(padY + padHeight / 2)) &&
            ballX < leftPadFrontBoundary &&
            ballX > leftPadFrontBoundary - padWidth
        )
            speedY *= -1;
        //Opponent paddleSidesHitManagement
        if (
            (Math.floor(ballY + ballRadius) ===
                Math.floor(OpponentPadY - padHeight / 2) ||
                Math.floor(ballY - ballRadius) ===
                    Math.floor(OpponentPadY + padHeight / 2)) &&
            ballX > rightPadFrontBoundary &&
            ballX < rightPadFrontBoundary + padWidth
        )
            speedY *= -1;
        //Goal
        if (ballX >= rightBound || ballX <= leftBound) {
            //Score
            score[0] = ballX >= rightBound ? score[0] + 1 : score[0];
            score[1] = ballX <= leftBound ? score[1] + 1 : score[1];
            //gameReset
            // // speedY = Math.random() * 0.1 - 0.1;
            // ballX = 0;
            // ballY = 0;
            // padY = 0;
            // OpponentPadY = 0;
            if (score[0] === 5 || score[1] === 5) {
                ballX = 0;
                ballY = 0;
                padY = 0;
                score[0] = 0;
                score[1] = 0;
                gameStart = false;
            }
        }
        //maxSpeed
        speedX = speedX > maxSpeed ? maxSpeed : speedX;
        speedX = speedX < -maxSpeed ? -maxSpeed : speedX;
        speedY = speedY > maxSpeed ? maxSpeed : speedY;
        speedY = speedY < -maxSpeed ? -maxSpeed : speedY;
        //ballPositionChange
        ballX += speedX;
        ballY += speedY;
        // debugger;
    }
    // if (direction === 'down') {
    // 	padY += 1;
    // 	padY = ( padY > lowerBound - padHeight / 2 - 5 ) ? lowerBound - padHeight / 2 - 5 : padY;
    // }
    // else if (direction === 'up') {
    // 	padY -= 1;
    // 	padY = (padY <= upperBound + padHeight / 2 + 5 ) ? upperBound + padHeight / 2 + 5 : padY;
    // }

    newState = {
        padY,
        OpponentPadY,
        ballX,
        ballY,
        speedX,
        speedY,
        score,
        date,
        timeInterval,
        side,
        gameStart,
        direction,
    };
    return newState;
}