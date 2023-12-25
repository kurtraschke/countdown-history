import React, { useMemo, useState } from "react";
import { Alignment, Button, ControlGroup, Icon, Navbar, NonIdealState, NonIdealStateIconSize } from "@blueprintjs/core";
import StationSelector from "./components/StationSelector.jsx";
import DirectionSelector from "./components/DirectionSelector.jsx";
import DateTimeSelector from "./components/DateTimeSelector.jsx";
import { DateTime, Duration } from "luxon";

import "./App.css";
import ResultsTable from "./components/ResultsTable.jsx";


function App() {

    const [selectedStation, setSelectedStation] = useState();
    const [selectedDirection, setSelectedDirection] = useState("N");
    const [selectedDateTime, setSelectedDateTime] = useState(DateTime.now()
        .minus(Duration.fromObject({ hours: 1 }))
        .startOf("second")
    );

    const selectedStopId = useMemo(
        () => {
            return (!!selectedStation && !!selectedDirection) ? `${selectedStation}${selectedDirection}` : null;
        },
        [selectedStation, selectedDirection]);

    return (
        <div className={"container"}>
            <div className={"header"}>
                <Navbar>
                    <Navbar.Group align={Alignment.LEFT}>
                        <Navbar.Heading>Countdown History</Navbar.Heading>
                    </Navbar.Group>
                </Navbar>
            </div>
            <div className={"inputs"}>
                <ControlGroup fill={true} vertical={false}>
                    <StationSelector
                        defaultSelectedItem={selectedStation}
                        onItemSelect={(item) => setSelectedStation(item["gtfs_stop_id"])} />
                    <DirectionSelector
                        defaultValue={selectedDirection}
                        onChange={(event) => {
                            setSelectedDirection(event.currentTarget.value);
                        }} />
                    <DateTimeSelector defaultValue={selectedDateTime} onChange={setSelectedDateTime} />
                </ControlGroup>
            </div>
            <div className={"content"}>
                {((!!selectedStopId) && (!!selectedDateTime)) ?
                <ResultsTable stopId={selectedStopId} dateTime={selectedDateTime} /> :
                <NonIdealState
                    icon={<Icon icon={"search"} size={NonIdealStateIconSize.STANDARD} />}
                    title={"Select parameters"}
                    description={"Select a station, direction, and probe time to continue."}
                />
                }
            </div>
            <div className={"footer"}>

            </div>
        </div>
    );
}

export default App;
