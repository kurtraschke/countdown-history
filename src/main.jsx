import React from "react";
import ReactDOM from "react-dom/client";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BlueprintProvider } from "@blueprintjs/core";

import App from "./App.jsx";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/table/lib/css/table.css";

import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage
});

const shouldDehydrateQuery = (query) => {
    const noPersist = !!query.meta?.noPersist;
    return defaultShouldDehydrateQuery(query) && !noPersist;
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <PersistQueryClientProvider client={queryClient} persistOptions={{
            persister: localStoragePersister,
            dehydrateOptions: { shouldDehydrateQuery }
        }}>
            <BlueprintProvider>
                <App />
            </BlueprintProvider>
        </PersistQueryClientProvider>
    </React.StrictMode>
);
