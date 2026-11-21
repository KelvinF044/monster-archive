
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatArchiveDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "DATE NOT REGISTERED";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) {
    return value;
  }

  const leapYear =
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0);

  const daysPerMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (day > daysPerMonth[month - 1]) {
    return value;
  }

  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
