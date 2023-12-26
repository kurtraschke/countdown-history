import { DateInput3 } from "@blueprintjs/datetime2";
import { DateTime } from "luxon";
import * as locales from "date-fns/locale";
import _ from "lodash";
import { Classes, FormGroup } from "@blueprintjs/core";

const localesByCode = new Map(_.map(locales, (e) => {
    return [e.code, e];
}));

function loader(localeCode) {
    const theLocale = localesByCode.get(localeCode);
    if (!!theLocale) {
        return Promise.resolve(theLocale);
    } else {
        return Promise.reject(`Locale ${localeCode} not found.`);
    }
}

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
            dateFnsLocaleLoader={loader}
        />
    </FormGroup>);
}

export default DateTimeSelector;