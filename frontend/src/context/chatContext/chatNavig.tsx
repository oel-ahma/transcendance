import {toInteger} from 'lodash';
import {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {protectedFetch} from '../../lib/fetchImprove';
import {RoomData, User} from './chatContextTypes';

export async function chatNavig({
    searchParams,
    setSearchParams,
    setLocation,
}: {
    token: string | null;
    deleteToken: () => void;
    searchParams: URLSearchParams;
    setSearchParams: any;
    setLocation: any;
}) {
    var joinRoomId = searchParams.get('joinRoomId');
    if (!joinRoomId) return;
    searchParams.delete('joinRoomId');
    setSearchParams(searchParams);

    setLocation('joinRoom', toInteger(joinRoomId));
}

export function useChatNavigTools({
    setLocation,
    setOpen,
    dmChannels,
    token,
    deleteToken,
    addPmChannel,
}: {
    setLocation: any;
    setOpen: (dir: boolean) => void;
    dmChannels: RoomData[];
    token: string | null;
    deleteToken: () => void;
    addPmChannel: (channel: RoomData) => void;
}) {
    const openPrivateMessage = useCallback(
        (userId: number) => {
            //if channel doesnt exist
            var finded = dmChannels.find(
                (value: RoomData) =>
                    value.users[0].user.id === userId ||
                    value.users[1].user.id === userId
            );
            if (!finded || true) {
                protectedFetch({
                    token,
                    deleteToken,
                    url: `/dm/${userId}`,
                    onSuccess(res: Response) {
                        if (res.status === 200) {
                            res.json().then((room: any) => {
                                var roomData: RoomData = {
                                    id: room.id,
                                    name: '',
                                    ownerId: 0,
                                    type: 'DM',
                                    messages: room.DMChannelMessage.map(
                                        (message: any) => {
                                            return {
                                                content: message.content,
                                                User: room.DMChannelUser.find(
                                                    (user: any) =>
                                                        user.userId ===
                                                        message.userId
                                                ).user,
                                                type: message.type,
                                            };
                                        }
                                    ),
                                    users: room.DMChannelUser.map(
                                        (message: any) => {
                                            return {
                                                state: 'USER',
                                                user: message.user,
                                            };
                                        }
                                    ),
                                };
                                addPmChannel(roomData);
                                setLocation('privateMessage', userId);
                            });
                        }
                    },
                });
            } else {
                setLocation('privateMessage', userId);
            }
            //if exist, add it
        },
        [setLocation, dmChannels, token, deleteToken, addPmChannel]
    );

    const navigate = useNavigate();
    const chatLink = useCallback(
        (location: string) => {
            setOpen(false);
            navigate(`${location}`);
        },
        [setOpen, navigate]
    );

    return {
        openPrivateMessage,
        chatLink,
    };
}
