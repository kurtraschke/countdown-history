import { DateInput3 } from "@blueprintjs/datetime2";
import { DateTime } from "luxon";
import { Classes, FormGroup } from "@blueprintjs/core";


const loadDateFnsLocale = async (localeCode) => {
    const localeModule = await import(`../../node_modules/date-fns/esm/locale/${localeCode}/index.js`);
    return localeModule.default;
};

function DateTimeSelector({ defaultValue, onChange }) {
    return (<FormGroup
        label="Probe Time"
        className={Classes.FIXED}
    >
        <DateInput3
            shortcuts={true}
            timePrecision={"second"}
            timePickerProps={{ showArrowButtons: true }}
            showTimezoneSelect={true}
            defaultTimezone={"US/Eastern"}
            defaultValue={defaultValue.toFormat("yyyy-MM-dd HH:mm:ss")}
            onChange={(value) => onChange(DateTime.fromISO(value))}
            dateFnsLocaleLoader={loadDateFnsLocale}
        />
    </FormGroup>);
}

export default DateTimeSelector;