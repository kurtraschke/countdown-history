import { Button, Collapse, Icon, NonIdealState, NonIdealStateIconSize, Pre } from "@blueprintjs/core";
import React, { useState } from "react";


const ErrorState = ({errorMessage}) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleClick = () => {
        setIsOpen(!isOpen);
    }

    return (<NonIdealState
        icon={<Icon icon={"warning-sign"} size={NonIdealStateIconSize.STANDARD} />}
        title={"Error"}>
        <Button onClick={handleClick}>
            {isOpen ? "Hide" : "Show"} details
        </Button>
        <Collapse isOpen={isOpen}>
            <Pre>
                {errorMessage}
            </Pre>
        </Collapse>
    </NonIdealState>);
}

export default ErrorState;