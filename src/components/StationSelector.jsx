import { Suggest } from "@blueprintjs/select";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FormGroup, MenuItem } from "@blueprintjs/core";

import { highlightText } from "../utils.jsx";
import { useState } from "react";

function StationSelector({ defaultSelectedItem, onItemSelect }) {
    const { isPending, error, data } = useQuery({
        queryKey: ["stations"],
        staleTime: 1000 * 60 * 60 * 24,
        queryFn: ({ signal }) =>
            axios
                .get("https://data.ny.gov/resource/39hk-dx4f.json", { signal })
                .then((res) => res.data)
    });

    const [selectedItem, setSelectedItem] = useState();

    const itemPredicate = (query, item, index, exactMatch) => {
        //console.log([query, item, index, exactMatch]);

        if (!exactMatch) {
            const inputValue = query.toLowerCase();

            return item["gtfs_stop_id"].toLowerCase().includes(inputValue) ||
                parseInt(item["station_id"]).toLocaleString(undefined, { minimumIntegerDigits: 3 }).includes(inputValue) ||
                parseInt(item["complex_id"]).toLocaleString(undefined, { minimumIntegerDigits: 3 }).includes(inputValue) ||
                item["stop_name"].toLowerCase().includes(inputValue);
        } else {
            return inputValue === item["stop_name"];
        }
    };

    const itemRenderer = (item, props) => {
        if (!props.modifiers.matchesPredicate) {
            return null;
        }

        return (
            <MenuItem
                key={item["gtfs_stop_id"]}
                text={highlightText(item["stop_name"], props.query)}
                active={props.modifiers.active}
                disabled={props.modifiers.disabled}
                label={`${item["division"]} ${item["line"]}`}
                onClick={props.handleClick}
                onFocus={props.handleFocus}
                ref={props.ref}
                roleStructure={"listoption"}
                selected={item === selectedItem}
            />
        );
    };

    const [disabled, selectItems] = (isPending || error ) ? [true, []] : [false, data];

    //const defaultItem = _.find(selectItems, (e) => e["gtfs_stop_id"] === defaultSelectedItem);

    return (
        <FormGroup
            label="Station">
            <Suggest
                inputProps={{ placeholder: "Enter name, station or complex MRN, or GTFS ID to search..." }}
                disabled={disabled}
                items={selectItems}
                itemRenderer={itemRenderer}
                inputValueRenderer={(item) => item["stop_name"]}
                itemPredicate={itemPredicate}
                itemsEqual={"gtfs_stop_id"}
                noResults={<MenuItem disabled={true} text="No results." roleStructure="listoption" />}
                popoverProps={{ matchTargetWidth: true }}
                resetOnSelect={true}
                onItemSelect={(item) => {setSelectedItem(item); onItemSelect(item);}}
                //defaultSelectedItem={defaultItem}
            />
        </FormGroup>
    );
}

export default StationSelector;