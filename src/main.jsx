import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/table/lib/css/table.css";


import './index.css'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {HotkeysProvider} from "@blueprintjs/core";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <HotkeysProvider>
                <App/>
            </HotkeysProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)
