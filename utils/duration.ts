import * as z from 'zod';

export type DurationUnit =
    | 'second'
    | 'seconds'
    | 'hour'
    | 'hours'
    | 'day'
    | 'days'
    | 'week'
    | 'weeks';

export const DurationSchema = z.string().refine((value) => {
    // multiple durations can be separated by a comma
    // every duration unit can only occur once, where hour/hours, day/days, and week/weeks are considered the same

    // const durations = value.split(',').map((d) => d.trim());

    // if (durations.length > 1) {
    //     return durations.every((d) => DurationSchema.check(d));
    // }

    const [number, unit] = value.split(' ');

    if (
        ![
            'second',
            'seconds',
            'hour',
            'hours',
            'day',
            'days',
            'week',
            'weeks',
        ].includes(unit)
    ) {
        return false;
    }

    if (parseInt(number) < 1 || parseInt(number) > 100) {
        return false;
    }

    return true;
});

export type Duration = z.infer<typeof DurationSchema>;

export const parseDuration = (
    duration: Duration
): { number: number; unit: DurationUnit } => {
    const [number, unit] = duration.split(' ');

    return {
        number: parseInt(number),
        unit: unit as DurationUnit,
    };
};
