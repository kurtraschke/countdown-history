import { Cell, Column, RegionCardinality, Table2 } from "@blueprintjs/table";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DateTime } from "luxon";
import _ from "lodash";
import React, { useState } from "react";
import {
    Button,
    Classes,
    ControlGroup,
    FormGroup,
    HTMLTable,
    MenuItem,
    NonIdealState,
    NonIdealStateIconSize,
    Popover,
    Spinner
} from "@blueprintjs/core";
import urlcat from "urlcat";
import { MultiSelect2 } from "@blueprintjs/select";


import ErrorState from "./ErrorState.jsx";
import { highlightText } from "../utils.jsx";

function formatTime({ arrival_time: arrivalTime, header_timestamp: headerTimestamp }) {
    const pointArrival = DateTime.fromISO(arrivalTime);
    const pointHeaderTimestamp = DateTime.fromISO(headerTimestamp);

    const diff = pointHeaderTimestamp.diff(pointArrival);

    const seconds = diff.as("seconds");

    return (Math.sign(seconds) === 1 ? "+" : "") + Math.round(Math.abs(seconds) / 60);
}

const API_BASE =
    import.meta.env.DEV && !!import.meta.env.VITE_API_BASE
        ? import.meta.env.VITE_API_BASE
        : "https://api.choochoo.systems/api/";

function ResultsTable({ stopId, dateTime }) {
    const [selectedTimeWindow, setSelectedTimeWindow] = useState();
    const [selectedRouteIds, setSelectedRouteIds] = useState(() => {
        return new Set();
    });
    const [selectedTracks, setSelectedTracks] = useState(() => {
        return new Set();
    });

    const { isPending, error, data } = useQuery({
        queryKey: ["countdown_history", stopId, dateTime],
        meta: { noPersist: true },
        queryFn: ({ signal, queryKey: [_, stopId, dateTime] }) =>
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

    const routeIds = React.useMemo(() => {
        if (!!data) {
            return new Set(data.points.map(p => p.route_id));
        }
    }, [data]);

    const tracks = React.useMemo(() => {
        if (!!data) {
            return new Set(data.points.map(p => p.actual_track || p.scheduled_track));
        }
    }, [data]);

    React.useEffect(() => {
        if (!!data) {
            const w = _.find(data.time_windows, (w) => !!w.contains_probe_time);
            setSelectedTimeWindow(w.bucket_end);
        }
    }, [data]);

    React.useEffect(() => {
        if (!!data && !!routeIds) {
            setSelectedRouteIds(routeIds);
        }
    }, [data, routeIds]);

    React.useEffect(() => {
        if (!!data && !!tracks) {
            setSelectedTracks(tracks);
        }
    }, [data, tracks]);

    const filteredPoints = React.useMemo(() => {
            if (!!data) {
                return _.chain(data.points)
                    .filter(p => selectedRouteIds.has(p.route_id))
                    .filter(p => selectedTracks.has(p.actual_track || p.scheduled_track))
                    .value();
            }
        },
        [data, selectedRouteIds, selectedTracks]);

    const sortedTrainIds = React.useMemo(() => {
            if (!!data) {
                const selectedBucketEnd = selectedTimeWindow;
                const selectedBucketEndParsed = DateTime.fromISO(selectedBucketEnd);

                const sortKeyForTrainId = (trainId) => {
                    const pointsForTrain = _.filter(filteredPoints, (e) => e.train_id === trainId);
                    const point = _.find(pointsForTrain, e => {
                        return e.bucket_end === selectedBucketEnd && e.train_id === trainId;
                    });

                    if (!!point) {
                        return point.arrival_time;
                    } else {
                        const sortedPoints = _.sortBy(pointsForTrain,
                            (e) => {
                                const pointHeaderTimestamp = DateTime.fromISO(e.bucket_end);

                                return Math.abs(selectedBucketEndParsed.diff(pointHeaderTimestamp).as("seconds"));
                            });

                        return _.first(sortedPoints).arrival_time;
                    }
                };

                const filteredTrainIds = new Set(filteredPoints.map(p => p.train_id));

                return _.sortBy(Array.from(filteredTrainIds), sortKeyForTrainId);
            }
        },
        [filteredPoints, selectedTimeWindow, data]);

    if (isPending) {
        return (<NonIdealState
            icon={<Spinner size={NonIdealStateIconSize.STANDARD} />}
            title={"Loading"}
        />);
    }

    if (error) {
        return (<ErrorState errorMessage={error.stack} />);
    }

    const makeArrivalsTable = (bucketEnd) => {
        const time = DateTime
            .fromISO(bucketEnd)
            .setZone("US/Eastern")
            .toLocaleString(DateTime.TIME_24_WITH_SECONDS);

        const arrivals = _.chain(filteredPoints)
            .filter((p) => {
                return p.bucket_end === bucketEnd;
            })
            .sortBy(p => {
                return p.arrival_time || p.departure_time;
            })
            .take(5)
            .value();

        return (<div>
            <h3>Arrivals at {time}</h3>
            <HTMLTable compact={true}>
                <thead>
                <tr>
                    <th>#</th>
                    <th>Train</th>
                    <th>Time</th>
                </tr>
                </thead>
                <tbody>
                {
                    arrivals.map((a, i) => (<tr key={a.train_id}>
                        <td>{i + 1}</td>
                        <td><code>{a.train_id}</code></td>
                        <td>{formatTime(a)}</td>
                    </tr>))
                }
                </tbody>
            </HTMLTable>
            <br />
            <Button className={Classes.POPOVER_DISMISS} text="Dismiss" />
        </div>);
    };

    const timestampRenderer = (rowNumber) => {
        const thisBucket = data.time_windows[rowNumber].bucket_end;
        const isSelected = thisBucket === selectedTimeWindow;
        return <Cell style={{ background: isSelected ? "#FBD065" : "" }}>
            <Popover
                interactionKind="click"
                popoverClassName={Classes.POPOVER_CONTENT_SIZING}
                placement="auto"
                content={makeArrivalsTable(thisBucket)}
                renderTarget={({ isOpen, ...targetProps }) => (
                    <span {...targetProps}> {DateTime
                        .fromISO(thisBucket)
                        .setZone("US/Eastern")
                        .toLocaleString(DateTime.TIME_24_WITH_SECONDS)}</span>
                )}
            />

        </Cell>;
    };

    const makeValueRenderer = (trainId) => {
        return (rowNumber) => {
            const bucketEnd = data.time_windows[rowNumber].bucket_end;
            const isSelected = bucketEnd === selectedTimeWindow;
            const point = _.find(filteredPoints, e => {
                return e.bucket_end === bucketEnd && e.train_id === trainId;
            });

            if (!!point) {
                return <Cell
                    style={{
                        fontWeight: point.is_assigned ? "bold" : "",
                        background: isSelected ? "#FBD065" : ""
                    }}
                    tooltip={DateTime
                        .fromISO(point.arrival_time)
                        .setZone("US/Eastern")
                        .toLocaleString(DateTime.TIME_24_WITH_SECONDS)}
                >{formatTime(point)}</Cell>;
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
        <div style={{
            display: "grid",
            "grid-template-rows": "max-content 1fr",
            height: "100%"
        }}>
            <ControlGroup>
                <FilterMultiselect
                    label={"Routes"}
                    items={routeIds}
                    selectedItems={selectedRouteIds}
                    setSelectedItems={setSelectedRouteIds} />
                <FilterMultiselect
                    label={"Tracks"}
                    items={tracks}
                    selectedItems={selectedTracks}
                    setSelectedItems={setSelectedTracks} />
            </ControlGroup>
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
        </div>
    );
}

const FilterMultiselect = ({ label, items, selectedItems, setSelectedItems }) => {
    const renderTag = (item) => item;

    const renderItem = (item, props) => {
        if (!props.modifiers.matchesPredicate) {
            return null;
        }

        return (
            <MenuItem
                active={props.modifiers.active}
                disabled={props.modifiers.disabled}
                key={item}
                onClick={props.handleClick}
                onFocus={props.handleFocus}
                ref={props.ref}
                roleStructure="listoption"
                selected={selectedItems.has(item)}
                shouldDismissPopover={false}
                text={highlightText(item, props.query)}
            />
        );
    };

    const itemSelect = (item) => {
        setSelectedItems((s) => {
            return s.union(new Set([item]));
        });
    };

    const itemDeselect = (item) => {
        setSelectedItems((s) => {
            return s.difference(new Set([item]));
        });
    };

    const filterItem = (query, item, _index, exactMatch) => {
        const normalizedItem = item.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedItem === normalizedQuery;
        } else {
            return normalizedItem.indexOf(normalizedQuery) >= 0;
        }
    };

    return (<FormGroup label={label}>
        <MultiSelect2
            resetOnSelect={true}
            itemPredicate={filterItem}
            itemRenderer={renderItem}
            tagRenderer={renderTag}
            onItemSelect={itemSelect}
            onRemove={itemDeselect}
            items={Array.from(items)}
            selectedItems={Array.from(selectedItems)} />
    </FormGroup>);
};

export default ResultsTable;