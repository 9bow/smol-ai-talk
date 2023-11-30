export function snowflake_now() {
    return date_to_snowflake(new Date());
}

export function date_to_snowflake(date: Date) {
    return `${(BigInt(date.getTime()) - 1420070400000n) << 22n}`;
}
