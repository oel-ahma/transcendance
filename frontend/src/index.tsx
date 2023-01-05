import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, useNavigate } from 'react-router-dom';
import App from './App';
import RightClickMenu from './component/rightClickMenu';
import { ChatProvider } from './context/chatContext/chatContext';
import { FriendsContext, FriendsContextProvider } from './context/friendsContext';
import { GameContext, GameContextProvider } from './context/gameContext';
import { RightClickMenuProvider } from './context/rightClickMenu';
import { UserContextProvider } from './context/userContext';

export const HEADERS = { 
	'Content-Type': 'application/json;charset=UTF-8',
	'Accept': 'application/json',
	'Access-Control-Allow-Origin': '*',
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
	<BrowserRouter>
		<RightClickMenuProvider>

			<UserContextProvider>
				<FriendsContextProvider>
					<GameContextProvider>
						<ChatProvider>
						<>
							<App />
				 			<RightClickMenu />
				 		</>
				 		</ChatProvider>
				 	</GameContextProvider>
				</FriendsContextProvider> 
			</UserContextProvider>
		</RightClickMenuProvider>
	</BrowserRouter>
);

