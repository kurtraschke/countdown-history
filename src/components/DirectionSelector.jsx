import { Classes, FormGroup, HTMLSelect } from "@blueprintjs/core";

const DIRECTIONS = [{ value: "N", label: "North" }, { value: "S", label: "South" }];

function DirectionSelector({ defaultValue, onChange }) {
    return (
        <FormGroup
            label="Direction"
            labelFor="direction-select"
            className={Classes.FIXED}>
            <HTMLSelect
                id="direction-select"
                placeholder="Select direction..."
                options={DIRECTIONS}
                onChange={onChange}
                defaultValue={defaultValue}
            />
        </FormGroup>
    );
}

export default DirectionSelector;