/**
 * Gets the remaining time between two dates.
 * Referenced from https://stackabuse.com/javascript-get-number-of-days-between-dates
 * Will most likely redo this in the future, just doesn't really have a purpose atm.
 */
export async function getTimeRemainingFromDates(start: number, end: number): Promise<string | null>
{
    const ONESECOND = 1000;
    const ONEMINUTE = ONESECOND * 60;
    const ONEHOUR = ONEMINUTE * 60;
    const ONEDAY = ONEHOUR * 24;

    const CALCDIFFINDATES = end - start;
    const REMAININGDAYS = Math.round(CALCDIFFINDATES / ONEDAY);
    const REMAININGHOURS = Math.round(CALCDIFFINDATES / ONEHOUR);
    const REMAININGMINUTES = Math.round(CALCDIFFINDATES / ONEMINUTE);
    const REMAININGSECONDS = Math.round(CALCDIFFINDATES / ONESECOND);

    switch (true)
    {
        case (REMAININGSECONDS <= 0): return null;
        case (REMAININGSECONDS < 60): return `${REMAININGSECONDS} ${REMAININGSECONDS > 1 ? 'seconds' : 'second'}`;
        case (REMAININGMINUTES < 60): return `${REMAININGMINUTES} ${REMAININGMINUTES > 1 ? 'minutes' : 'minute'}`;
        case (REMAININGHOURS < 24): return `${REMAININGHOURS} ${REMAININGHOURS > 1 ? 'hours' : 'hour'}`;
        default: return `${REMAININGDAYS} ${REMAININGDAYS > 1 ? 'days' : 'day'} ${REMAININGHOURS % 24} ${REMAININGHOURS > 1 ? 'hours' : 'hour'}`;
    };
}

export async function getTimeFromtDates()
{
    
}