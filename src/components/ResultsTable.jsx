import { Cell, Column, RegionCardinality, Table2 } from "@blueprintjs/table";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DateTime } from "luxon";
import _ from "lodash";
import React, { useState } from "react";
import { NonIdealState, NonIdealStateIconSize, Spinner } from "@blueprintjs/core";
import ErrorState from "./ErrorState.jsx";
import urlcat from "urlcat";

function formatTime(seconds) {
    return (Math.sign(seconds) === 1 ? "+" : "") + Math.round(Math.abs(seconds) / 60);
}

const API_BASE =
    import.meta.env.DEV && !!import.meta.env.VITE_API_BASE
        ? import.meta.env.VITE_API_BASE
        : "https://api.choochoo.systems/";

function ResultsTable({ stopId, dateTime }) {
    const [selectedTimeWindow, setSelectedTimeWindow] = useState();

    const { isLoading, error, data } = useQuery({
        queryKey: ["countdown_history", stopId, dateTime],
        queryFn: ({ signal }) =>
            axios
                .get(urlcat(API_BASE, "/rpc/countdown_history_json_v2"),
                    {
                        params: {
                            stop_id: stopId,
                            probe_time: dateTime.startOf("second").toISO({ suppressMilliseconds: true })
                        },
                        signal
                    })
                .then((res) => res.data)
    });

    React.useEffect(() => {
        if (!!data) {
            const w = _.find(data.time_windows, (w) => !!w.contains_probe_time);
            setSelectedTimeWindow(w.bucket_end);
        }
    }, [data]);

    const sortedTrainIds = React.useMemo(() => {
            if (!!data) {

                const selectedBucketEnd = selectedTimeWindow;
                const selectedBucketEndParsed = DateTime.fromISO(selectedBucketEnd);

                const sortKeyForTrainId = (trainId) => {
                    const point = _.find(data.points, e => {
                        return e.bucket_end === selectedBucketEnd && e.train_id === trainId;
                    });
                    if (!!point) {
                        return point.arrival_time;
                    } else {
                        const pointsForTrain = _.filter(data.points, (e) => e.train_id === trainId);

                        const sortedPoints = _.sortBy(pointsForTrain, (e) => {
                            const pointHeaderTimestamp = DateTime.fromISO(e.bucket_end);

                            return Math.abs(selectedBucketEndParsed.diff(pointHeaderTimestamp).as("seconds"));
                        });

                        return _.first(sortedPoints).arrival_time;
                    }
                };

                return _.sortBy(data.train_ids, sortKeyForTrainId);
            }

        },
        [selectedTimeWindow, data]);

    if (isLoading) {
        return (<NonIdealState
            icon={<Spinner size={NonIdealStateIconSize.STANDARD} />}
            title={"Loading"}
        />);
    }

    if (error) {
        return (<ErrorState errorMessage={error.stack} />);
    }

    const timestampRenderer = (rowNumber) => {
        const thisBucket = data.time_windows[rowNumber].bucket_end;
        const isSelected = thisBucket === selectedTimeWindow;
        return <Cell style={{ background: isSelected ? "#FBD065" : "" }}>
            {
                DateTime
                    .fromISO(thisBucket)
                    .setZone("US/Eastern")
                    .toLocaleString(DateTime.TIME_24_WITH_SECONDS)
            }
        </Cell>;
    };

    const makeValueRenderer = (trainId) => {
        return (rowNumber) => {
            const bucketEnd = data.time_windows[rowNumber].bucket_end;
            const isSelected = bucketEnd === selectedTimeWindow;
            const point = _.find(data.points, e => {
                return e.bucket_end === bucketEnd && e.train_id === trainId;
            });

            if (!!point) {
                const pointArrival = DateTime.fromISO(point.arrival_time);
                const pointHeaderTimestamp = DateTime.fromISO(point.header_timestamp);

                const diff = pointHeaderTimestamp.diff(pointArrival);

                return <Cell
                    style={{
                        fontWeight: point.is_assigned ? "bold" : "",
                        background: isSelected ? "#FBD065" : ""
                    }}>{formatTime(diff.as("seconds"))}</Cell>;
            } else {
                return <Cell style={{
                    background: isSelected ? "#FBD065" : ""
                }}></Cell>;
            }

        };
    };

    const setSelection = (selection) => {
        if (selection.length === 1) {
            const rowNumber = selection[0].rows[0];
            const bucketEnd = data.time_windows[rowNumber].bucket_end;
            setSelectedTimeWindow(bucketEnd);
        }
    };


    return (
        <Table2
            numRows={data.time_windows.length}
            numFrozenColumns={1}
            selectionModes={[RegionCardinality.FULL_ROWS]}
            //enableFocusedCell={true}
            enableMultipleSelection={false}
            onSelection={setSelection}
            cellRendererDependencies={[sortedTrainIds]}
        >
            <Column name={"Time"} cellRenderer={timestampRenderer} />
            {
                sortedTrainIds.map((e) => {
                    return <Column name={e} key={e} cellRenderer={makeValueRenderer(e)} />;
                })
            }
        </Table2>
    );
}

export default ResultsTable;