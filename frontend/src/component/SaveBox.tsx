export default function SaveBox({
    onReset,
    onSave,
}: {
    onReset: () => void;
    onSave: () => void;
}) {
    return (
        <div className="SaveBox">
            <div className="SaveBox--bg"></div>
            <p>Care, there is unsave modifications!</p>
            <div className="SaveBox__buttons">
                <button onClick={onReset}>Reset</button>
                <button onClick={onSave}>Save modifications</button>
            </div>
        </div>
    );
}

export function ErrorBox(props: {content?: Record<string, string> | string[]}) {
    return (
        <div className="SaveBox">
            <div className="SaveBox--bg SaveBox--bg--error"></div>
            <p>Error occured!</p>
            {props?.content
                ? Object.values(props.content).map((el, index) => (
                      <p key={index}>{el}</p>
                  ))
                : ''}
        </div>
    );
}

