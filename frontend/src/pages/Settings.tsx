import _ from 'lodash';
import React, {useContext, useEffect, useState} from 'react';
import ImageUploader from '../component/ImageUploader';
import InvisibleInput, {
    InvisibleInputSelect,
} from '../component/InvisibleInput';
import SaveBox, {ErrorBox} from '../component/SaveBox';
import {ConnectedUser} from '../context/chatContext/chatContextTypes';
import {UserContext, UserContextValue} from '../context/userContext';
import {BACKEND_HOSTNAME} from '../envir';
import {protectedFetch} from '../lib/fetchImprove';

export interface ConnectedUserWithImg extends ConnectedUser {
    image: null | any;
}

export default function Settings() {
    const {content, updateProfile, token, deleteToken, enable2fa} = useContext(
        UserContext
    ) as UserContextValue;
    const [user, setUser] = useState<ConnectedUserWithImg>({
        name: '',
        avatar: '',
        id: 0,
        otp_enable: false,
        image: null,
    });
    const [twoFactors, setTwoFactors] = useState<string>('Disable');
    const [modified, setModified] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<
        false | Record<string, string> | string[]
    >(false);
    const [img2fa, setImg2fa] = useState<any>(null);
    const [code2fa, setCode2fa] = useState<string>('');

    useEffect(() => {
        setLoading(false);
        reset();
    }, [content]);

    useEffect(() => {
        reset();
        setTwoFactors(content.otp_enable ? 'Enable' : 'Disable');
    }, []);

    function reset() {
        setUser({...content, image: null});
    }

    /* udapters */
    function setImage(image: any) {
        user.image = image;
        setUser({...user});
    }
    function resetImage() {
        user.image = null;
        setUser({...user});
    }
    function setUserName(name: string) {
        user.name = name;
        setUser({...user});
    }
    function setTwoFactorsEvent(value: string) {
        setTwoFactors(value);
        if (value === 'Enable') {
            user.otp_enable = true;
            protectedFetch({
                token,
                deleteToken,
                url: '/auth/2fa/generate',
                method: 'POST',
                onSuccess: (data: Response) => {
                    if (data.status === 201 && img2fa === null)
                        data.blob().then((img: any) => setImg2fa(img));
                },
            });
        } else user.otp_enable = false;
        setUser({...user});
    }
    /* end udapters */
    function send2fa() {
        setLoading(true);
        enable2fa(code2fa, async (res: Response) => {
            setLoading(false);
            if (!res.ok) {
                let errors = await res.json();
                if ('message' in errors) errors = errors['message'];
                if (typeof errors == 'string') setError([errors]);
                else if (errors) setError(errors);
            }
        });
    }

    useEffect(() => {
        if (_.isEqual({...content, image: null}, user) === false)
            setModified(true);
        else setModified(false);
    }, [user]);

    function updateProfileEvent() {
        setLoading(true);
        updateProfile(user, (res: Response) => {
            setLoading(false);
            setError(false);
        },
        (data: any) => {
            data.json().then((errors: any)=>{
                setLoading(false);
                if ('message' in errors) errors = errors['message'];
                if (errors as string[]) setError(errors);
            }) 
        });
    }

    function enterTouch(e: any) {
        if (modified && e.key === "Enter")
            updateProfileEvent()
    }

    return (
        <div
            className={'Parameter'}
            style={{backgroundColor: 'black', color: 'white'}}
            onKeyDown={enterTouch}
            tabIndex={0}
        >
            <div className={'ProfilPage__title'}>Settings</div>
            {(loading || !content.avatar) ? (
                <p>loading...</p>
            ) : (
                <>
                    <div className="ChannelParameter__image">
                        <img
                            alt="not fount"
                            src={
                                user.image
                                    ? URL.createObjectURL(user.image)
                                    : `${BACKEND_HOSTNAME}/${content.avatar}`
                            }
                            onError={resetImage}
                        />
                        <ImageUploader setSelectedImage={setImage} />
                    </div>
                    <InvisibleInput
                        name={'User name'}
                        value={user.name}
                        setValue={setUserName}
                    />
                    <InvisibleInputSelect
                        name={'Enable two factors'}
                        choices={['Enable', 'Disable']}
                        setSelected={setTwoFactorsEvent}
                        selected={twoFactors}
                        isLock={content.otp_enable}
                    />
                    {twoFactors === 'Enable' &&
                        img2fa &&
                        content.otp_enable === false && (
                            <div className="Parameter__twoFactor">
                                <img src={URL.createObjectURL(img2fa)} alt="" />
                                <InvisibleInput
                                    name={'Code'}
                                    value={code2fa}
                                    setValue={setCode2fa}
                                />
                                <div
                                    className={'smallButton'}
                                    onClick={send2fa}
                                >
                                    Check code
                                </div>
                            </div>
                        )}
                    {modified && (
                        <SaveBox onReset={reset} onSave={updateProfileEvent} />
                    )}
                    {error && <ErrorBox content={error} />}
                </>
            )}
        </div>
    );
}

