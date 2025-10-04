import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction, SVGProps } from "react";

const SECOND = 1000;

export type TimerProps = {
    deadline?: string | number | Date;
    title?: string;
    paused?: boolean;
    timeRemaining: number;
    setTimeRemaining: Dispatch<SetStateAction<number>>;
};

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

export const Timer = ({
    deadline = new Date().toString(),
    title = "Focus Session",
    paused = false,
    timeRemaining,
    setTimeRemaining,
}: TimerProps) => {
    const parsedDeadline = useMemo(() => {
        if (deadline instanceof Date) {
            return deadline.getTime();
        }

        if (typeof deadline === "number") {
            return deadline;
        }

        const parsed = Date.parse(deadline);
        return Number.isNaN(parsed) ? Date.now() : parsed;
    }, [deadline]);

    useEffect(() => {
        setTimeRemaining(Math.max(0, parsedDeadline - Date.now()));
    }, [parsedDeadline, setTimeRemaining]);

    useEffect(() => {
        if (paused || timeRemaining <= 0) {
            return;
        }


        // Basically I just check if the timer is zero.
        const interval = setInterval(() => {
            setTimeRemaining((previous) => {
                const next = previous - SECOND;
                return next > 0 ? next : 0;
            });
        }, SECOND);

        return () => clearInterval(interval);
    }, [paused, timeRemaining, setTimeRemaining]);

    const timeLeft = useMemo(() => {
        const total = Math.max(0, timeRemaining);

        return {
            raw: timeRemaining,
            totalSeconds: Math.floor(total / SECOND),
        };
    }, [timeRemaining]);

    const minutesDisplay = Math.floor(timeLeft.totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const secondsDisplay = (timeLeft.totalSeconds % 60)
        .toString()
        .padStart(2, "0");

    if (timeLeft.raw <= 0) {
        return (
            <div className="max-w-md mx-auto w-full">
                <div className="rounded-3xl border border-[#00CFDE]/30 bg-white/5 p-10 text-center backdrop-blur-sm shadow-lg">
                    <div className="flex items-center justify-center gap-3 text-[#00CFDE]">
                        <ClockIcon className="h-8 w-8" />
                        <span className="uppercase tracking-[0.35em] text-sm">
                            {title}
                        </span>
                    </div>
                    <div className="mt-6 font-mono text-6xl font-semibold text-white">
                        00:00
                    </div>
                    <p className="mt-6 text-sm text-white/70">
                        Session complete. Take a short break!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto w-full">
            <div className="rounded-3xl border border-[#00CFDE]/30 bg-white/5 p-10 text-center backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-center gap-3 text-[#00CFDE]">
                    <ClockIcon className="h-8 w-8" />
                    <span className="uppercase tracking-[0.35em] text-sm">
                        {title}
                    </span>
                </div>

                <div className="mt-6 font-mono text-6xl md:text-7xl font-semibold text-white">
                    {minutesDisplay}:{secondsDisplay}
                </div>
            </div>
        </div>
    );
};
