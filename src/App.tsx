import { useEffect, useRef, useState } from "react";

import { Timer } from "./components/Timer";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const App = () => {
    const [deadline] = useState(() => new Date(Date.now() + DAY_IN_MS));
    const [timeRemaining, setTimeRemaining] = useState(() =>
        Math.max(0, deadline.getTime() - Date.now()),
    );

    // Temp constant
    const paused = false;

    const totalSeconds = Math.max(0, Math.floor(timeRemaining / 1000));
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const dynamicTitle = `${minutes}:${seconds} - Coindoro`;

    const defaultTitleRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        if (defaultTitleRef.current === undefined) {
            defaultTitleRef.current = document.title;
        }

        document.title = dynamicTitle;
    }, [dynamicTitle]);

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        return () => {
            if (defaultTitleRef.current !== undefined) {
                document.title = defaultTitleRef.current;
            }
        };
    }, []);

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-slate-900 px-4 py-16 text-white">
            <Timer
                deadline={deadline}
                title={dynamicTitle}
                paused={paused}
                timeRemaining={timeRemaining}
                setTimeRemaining={setTimeRemaining}
            />
        </main>
    );
};

export default App;
