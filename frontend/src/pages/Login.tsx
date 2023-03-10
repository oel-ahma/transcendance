import React, {useContext, useState} from 'react';
import InvisibleInput from '../component/InvisibleInput';
import Cross from '../images/cross.svg';
import {UserContext, UserContextValue} from '../context/userContext';

export default function Login() {
    const {login, devLogin, loading, tempToken, validate2fa, deleteToken} =
        useContext(UserContext) as UserContextValue;
    const [tokVal, setTokVal] = useState<string>('');
    const [twoFactorCode, setTwoFactorCode] = useState<string>('');
    const [tfError, setTfError] = useState<boolean>(false);

    function devLoginEvent(e: any) {
        e.preventDefault();
        devLogin(tokVal);
    }
    function validate2faEvent() {
        setTwoFactorCode('');
        validate2fa(twoFactorCode, setTfError);
    }
    return (
        <div className={'Login'}>
            {loading ? (
                <p>Loading...</p>
            ) : tempToken ? (
                <div className={'Login__2fa'}>
                    <InvisibleInput
                        error={tfError}
                        name={'two factors code'}
                        value={twoFactorCode}
                        setValue={setTwoFactorCode}
                    />
                    <div className={'smallButton'} onClick={validate2faEvent}>
                        Validate code
                    </div>
                    <img
                        className={'Login__2fa__cross'}
                        alt=""
                        src={Cross}
                        onClick={() => deleteToken()}
                    />
                </div>
            ) : (
                <div className={'Login__button'} onClick={login}>
                    Login with{' '}
                    <img
                        src={
                            'https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg'
                        }
                        alt="42"
                    />
                </div>
            )}


            {process.env.REACT_APP_ENV === 'local' && (
                <>
                <hr />

                <form
                    action="."
                    onSubmit={devLoginEvent}
                    className="connectDev"
                >
                    <InvisibleInput
                        name={'Developer Token'}
                        value={tokVal}
                        setValue={setTokVal}
                    />
                    <button type="submit" id="devLoginButton">
                        Send
                    </button>
                </form>
                </>
            )}
        </div>
    );
}

